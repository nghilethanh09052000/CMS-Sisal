/* eslint-disable no-unused-vars */
import TableContainer from '@material-ui/core/TableContainer'
import Table from '@material-ui/core/Table';
import TableFooter from '@material-ui/core/TableFooter';
import TableRow from '@material-ui/core/TableRow';
import LinearProgress from '@material-ui/core/LinearProgress';
import DoubleScrollbar from "react-double-scrollbar";
import * as React from 'react';
import { MTablePagination, MTableSteppedPagination } from './components';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import DataManager from './utils/data-manager';
import { debounce } from 'debounce';
import equal from 'fast-deep-equal';
import { withStyles } from '@material-ui/core';
import * as CommonValues from './utils/common-values';

/* eslint-enable no-unused-vars */

export default class MaterialTable extends React.Component {
  dataManager = new DataManager();

  constructor(props) {
    super(props);

    const calculatedProps = this.getProps(props);
    this.setDataManagerFields(calculatedProps, true);
    const renderState = this.dataManager.getRenderState();

    this.state = {
      data: [],
      ...renderState,
      query: {
        filters: renderState.columns
          .filter(a => a.tableData.filterValue)
          .map(a => ({
            column: a,
            operator: "=",
            value: a.tableData.filterValue
          })),
        orderBy: renderState.columns.find(a => a.tableData.id === renderState.orderBy),
        orderDirection: renderState.orderDirection,
        page: 0,
        pageSize: calculatedProps.options.pageSize,
        pageSizeOptions: calculatedProps.options.pageSizeOptions,
        search: renderState.searchText,

        totalCount: 0
      },
      showAddRow: false,
      width: 0,
      viewWidth: 0
    };

    this.tableContainerDiv = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this._handleResize)
    this.setState({ ...this.dataManager.getRenderState(), width: this.tableContainerDiv.current.scrollWidth, viewWidth: this.tableContainerDiv.current.clientWidth }, () => {
      if (this.isRemoteData()) {
        // long.toquoc modified
        this.onQueryChange(this.state.query, null);
      }
    });
  }

  componentWillUnmount() {
    // LCD added
    window.removeEventListener('resize', this.handleResize)
  }

  // LCD added
  handleResize = (evt) => {
    // console.log('_handleResize in table width', this.state.width, 'vs', this.tableContainerDiv.current.scrollWidth, 'view', this.state.viewWidth, 'vs', this.tableContainerDiv.current.clientWidth)
    if (this.tableContainerDiv.current.scrollWidth !== this.state.width ||
      this.tableContainerDiv.current.clientWidth !== this.state.clientWidth) {
      this.setState({
        width: this.tableContainerDiv.current.scrollWidth,
        viewWidth: this.tableContainerDiv.current.clientWidth
      })
    }
  }

  setDataManagerFields(props, isInit) {
    let defaultSortColumnIndex = -1;
    let defaultSortDirection = '';
    if (props && props.options.sorting !== false) {
      defaultSortColumnIndex = props.columns.findIndex(a => a.defaultSort && a.sorting !== false);
      defaultSortDirection = defaultSortColumnIndex > -1 ? props.columns[defaultSortColumnIndex].defaultSort : '';
    }

    this.dataManager.setColumns(props.columns);
    this.dataManager.setDefaultExpanded(props.options.defaultExpanded);
    this.dataManager.changeRowEditing();

    if (this.isRemoteData(props)) {
      this.dataManager.changeApplySearch(false);
      this.dataManager.changeApplyFilters(false);
      this.dataManager.changeApplySort(false);
    }
    else {
      this.dataManager.changeApplySearch(true);
      this.dataManager.changeApplyFilters(true);
      this.dataManager.changeApplySort(true);
      this.dataManager.setData(props.data);
    }

    // If the columns changed and the defaultSorting differs from the current sorting, it will trigger a new sorting
    const shouldReorder = (isInit || (defaultSortColumnIndex !== this.dataManager.orderBy && defaultSortDirection !== this.dataManager.orderDirection));
    shouldReorder && this.dataManager.changeOrder(defaultSortColumnIndex, defaultSortDirection);
    isInit && this.dataManager.changeSearchText(props.options.searchText || '');
    isInit && this.dataManager.changeCurrentPage(props.options.initialPage ? props.options.initialPage : 0);
    (isInit || this.isRemoteData()) && this.dataManager.changePageSize(props.options.pageSize);
    this.dataManager.changePaging(props.options.paging);
    isInit && this.dataManager.changeParentFunc(props.parentChildData);
    this.dataManager.changeDetailPanelType(props.options.detailPanelType);
  }

  cleanColumns(columns) {
    return columns.map(col => {
      const colClone = { ...col };
      delete colClone.tableData;
      return colClone;
    });
  }

  // long.toquoc added
  shouldComponentUpdate(nextProps, nextState)
  {
    if (this.isRemoteData())
    {
      return !(nextState.isLoading || nextProps.isLoading)
    }
    
    return true
  }

  componentDidUpdate(prevProps) {
    // const propsChanged = Object.entries(this.props).reduce((didChange, prop) => didChange || prop[1] !== prevProps[prop[0]], false);

    const fixedPrevColumns = this.cleanColumns(prevProps.columns);
    const fixedPropsColumns = this.cleanColumns(this.props.columns);

    let propsChanged = !equal(fixedPrevColumns, fixedPropsColumns);
    propsChanged = propsChanged || !equal(prevProps.options, this.props.options);
    if (!this.isRemoteData()) {
      propsChanged = propsChanged || !equal(prevProps.data, this.props.data);
    }

    if (propsChanged) {
      const props = this.getProps(this.props);
      this.setDataManagerFields(props);
      this.setState(this.dataManager.getRenderState());
    }

    const count = this.isRemoteData() ? this.state.query.totalCount : this.state.data.length;
    const currentPage = this.isRemoteData() ? this.state.query.page : this.state.currentPage;
    const pageSize = this.isRemoteData() ? this.state.query.pageSize : this.state.pageSize;

    if (count <= pageSize * currentPage && currentPage !== 0) {
      this.onPageChange(null, Math.max(0, Math.ceil(count / pageSize) - 1));
    }
  }

  // long.toquoc Explicitly define the click add event to get the ref
  handleAddRow = () => {
    if (!!this.dataManager.lastEditingRow) return
    
    this.dataManager.changeRowEditing();
    this.setState({
      ...this.dataManager.getRenderState(),
      showAddRow: !this.state.showAddRow,
    });
  }

  getProps(props) {
    const calculatedProps = { ...(props || this.props) };
    calculatedProps.components = { ...MaterialTable.defaultProps.components, ...calculatedProps.components };
    calculatedProps.icons = { ...MaterialTable.defaultProps.icons, ...calculatedProps.icons };
    calculatedProps.options = { ...MaterialTable.defaultProps.options, ...calculatedProps.options };

    const localization = { ...MaterialTable.defaultProps.localization.body, ...calculatedProps.localization.body };

    calculatedProps.actions = [...(calculatedProps.actions || [])];

    if (calculatedProps.options.selection)
      calculatedProps.actions = calculatedProps.actions.filter(a => a).map(action => {
        if (
          (action.position === "auto") ||
          (action.isFreeAction === false) ||
          (action.position === undefined && action.isFreeAction === undefined)
        )
          if (typeof action === "function") return { action: action, position: "toolbarOnSelect" };
          else return { ...action, position: "toolbarOnSelect" };
        else if (action.isFreeAction)
          if (typeof action === "function") return { action: action, position: "toolbar" };
          else return { ...action, position: "toolbar" };
        else return action;
      });
    else
      calculatedProps.actions = calculatedProps.actions.filter(a => a).map(action => {
        if (
          (action.position === "auto") ||
          (action.isFreeAction === false) ||
          (action.position === undefined && action.isFreeAction === undefined)
        )
          if (typeof action === "function") return { action: action, position: "row" };
          else return { ...action, position: "row" };
        else if (action.isFreeAction)
          if (typeof action === "function") return { action: action, position: "toolbar" };
          else return { ...action, position: "toolbar" };
        else return action;
      });

    if (calculatedProps.editable) {
      if (calculatedProps.editable.onRowAdd) {
        calculatedProps.actions.push({
          icon: calculatedProps.icons.Add,
          tooltip: localization.addTooltip,
          position: "toolbar",
          disabled: !!this.dataManager.lastEditingRow,
          // long.toquoc Explicitly define the click add event to get the ref
          onClick: this.handleAddRow
        });
      }
      if (calculatedProps.editable.onRowUpdate) {
        calculatedProps.actions.push(rowData => ({
          icon: calculatedProps.icons.Edit,
          tooltip: calculatedProps.editable.editTooltip ? calculatedProps.editable.editTooltip(rowData) : localization.editTooltip,
          disabled: calculatedProps.editable.isEditable && !calculatedProps.editable.isEditable(rowData),
          hidden: calculatedProps.editable.isEditHidden && calculatedProps.editable.isEditHidden(rowData),
          onClick: (e, rowData) => {
            this.dataManager.changeRowEditing(rowData, "update");
            this.setState({
              ...this.dataManager.getRenderState(),
              showAddRow: false
            });
          }
        }));
      }
      if (calculatedProps.editable.onRowDelete) {
        calculatedProps.actions.push(rowData => ({
          icon: calculatedProps.icons.Delete,
          tooltip: calculatedProps.editable.deleteTooltip ? calculatedProps.editable.deleteTooltip(rowData) : localization.deleteTooltip,
          disabled: calculatedProps.editable.disabled || (calculatedProps.editable.isDeletable && !calculatedProps.editable.isDeletable(rowData)),
          hidden: calculatedProps.editable.isDeleteHidden && calculatedProps.editable.isDeleteHidden(rowData),
          onClick: (e, rowData) => {
            this.dataManager.changeRowEditing(rowData, "delete");
            this.setState({
              ...this.dataManager.getRenderState(),
              showAddRow: false
            });
          }
        }));
      }
    }

    return calculatedProps;
  }

  isRemoteData = (props) => !Array.isArray((props || this.props).data)

  isOutsidePageNumbers = (props) => (props.page !== undefined && props.totalCount !== undefined);

  onAllSelected = (checked) => {
    this.dataManager.changeAllSelected(checked);
    this.setState(this.dataManager.getRenderState(), () => this.onSelectionChange());
  }

  onChangeColumnHidden = (column, hidden) => {
    this.dataManager.changeColumnHidden(column, hidden);
    this.setState(this.dataManager.getRenderState(), () => {
      this.props.onChangeColumnHidden && this.props.onChangeColumnHidden(column, hidden);
    });
  }

  onChangeGroupOrder = (groupedColumn) => {
    this.dataManager.changeGroupOrder(groupedColumn.tableData.id);
    this.setState(this.dataManager.getRenderState());
  }

  onChangeOrder = (orderBy, orderDirection) => {
    const newOrderBy = orderDirection === '' ? -1 : orderBy;
    this.dataManager.changeOrder(newOrderBy, orderDirection);

    if (this.isRemoteData()) {
      const query = { ...this.state.query };
      query.page = 0;
      query.orderBy = this.state.columns.find(a => a.tableData.id === newOrderBy);
      query.orderDirection = orderDirection;
      this.onQueryChange(query, () => {
        this.props.onOrderChange && this.props.onOrderChange(newOrderBy, orderDirection);
      });
    } else {
      this.setState(this.dataManager.getRenderState(), () => {
        this.props.onOrderChange && this.props.onOrderChange(newOrderBy, orderDirection);
      });
    }
  }

  onPageChange = (event, page) => {
    if (this.isRemoteData()) {
      const query = { ...this.state.query };
      query.page = page;
      this.onQueryChange(query, () => {
        this.props.onPageChange && this.props.onPageChange(page);
      });
    }
    else {
      if (!this.isOutsidePageNumbers(this.props)) {
        this.dataManager.changeCurrentPage(page);
      }
      this.setState(this.dataManager.getRenderState(), () => {
        this.props.onPageChange && this.props.onPageChange(page);
      });
    }
  }

  onRowsPerPageChange = (event) => {
    const pageSize = event.target.value;

    this.dataManager.changePageSize(pageSize);

    this.props.onPageChange && this.props.onPageChange(0);

    if (this.isRemoteData()) {
      const query = { ...this.state.query };
      query.pageSize = event.target.value;
      query.page = 0;
      this.onQueryChange(query, () => {
        this.props.onRowsPerPageChange && this.props.onRowsPerPageChange(pageSize);
      });
    }
    else {
      this.dataManager.changeCurrentPage(0);
      this.setState(this.dataManager.getRenderState(), () => {
        this.props.onRowsPerPageChange && this.props.onRowsPerPageChange(pageSize);
      });
    }
  }

  onDragEnd = result => {
    if (!result || !result.source || !result.destination) return;
    this.dataManager.changeByDrag(result);
    this.setState(this.dataManager.getRenderState(), () => {
      if (this.props.onColumnDragged && result.destination.droppableId === "headers" &&
        result.source.droppableId === "headers") {
        this.props.onColumnDragged(result.source.index, result.destination.index);
      }
    });
  }

  onGroupExpandChanged = (path) => {
    this.dataManager.changeGroupExpand(path);
    this.setState(this.dataManager.getRenderState());
  }

  onGroupRemoved = (groupedColumn, index) => {
    const result = {
      combine: null,
      destination: { droppableId: "headers", index: 0 },
      draggableId: groupedColumn.tableData.id,
      mode: "FLUID",
      reason: "DROP",
      source: { index, droppableId: "groups" },
      type: "DEFAULT"
    };
    this.dataManager.changeByDrag(result);
    this.setState(this.dataManager.getRenderState(), () => {
      this.props.onGroupRemoved && this.props.onGroupRemoved(groupedColumn, index);
    });
  }

  onEditingApproved = (mode, newData, oldData) => {
    if (mode === "add" && this.props.editable && this.props.editable.onRowAdd) {
      // long.toquoc remove handle Promise.
      // CMS should take care this.
      this.props.editable.onRowAdd(newData)
      this.setState({ showAddRow: false }, () => {
        if (this.isRemoteData()) {
          this.onQueryChange(this.state.query);
        }
      });
    } else if (
      mode === "update" &&
      this.props.editable &&
      this.props.editable.onRowUpdate
    ) {
      // long.toquoc remove handle Promise.
      // CMS should take care this.
      this.props.editable.onRowUpdate(newData, oldData)
      this.dataManager.changeRowEditing(oldData);
      this.setState(
        {
          ...this.dataManager.getRenderState(),
        },
        () => {
          if (this.isRemoteData()) {
            this.onQueryChange(this.state.query);
          }
        }
      );
    } else if (
      mode === "delete" &&
      this.props.editable &&
      this.props.editable.onRowDelete
    ) {
      // long.toquoc remove handle Promise.
      // CMS should take care this.
      this.props.editable.onRowDelete(oldData)
      this.dataManager.changeRowEditing(oldData);
      this.setState(
        {
          ...this.dataManager.getRenderState(),
        },
        () => {
          if (this.isRemoteData()) {
            this.onQueryChange(this.state.query);
          }
        }
      );
    }
  };

  onEditingCanceled = (mode, rowData) => {
    if (mode === "add") {
      this.props.editable.onRowAddCancelled && this.props.editable.onRowAddCancelled();
      this.setState({ showAddRow: false });
    }
    else if (mode === "update") {
      this.props.editable.onRowUpdateCancelled && this.props.editable.onRowUpdateCancelled();
      this.dataManager.changeRowEditing(rowData);
      this.setState(this.dataManager.getRenderState());
    }
    else if (mode === "delete") {
      this.dataManager.changeRowEditing(rowData);
      this.setState(this.dataManager.getRenderState());
    }

  }

  onQueryChange = (query, callback, isEnter = true) => {
    // long.toquoc modified
    if (isEnter)
    {
      query = { ...this.state.query, ...query };
      this.setState({ isLoading: true }, () => {
        this.props.data(query).then((result) => {
          query.totalCount = result.totalCount;
          query.page = result.page;
          this.dataManager.setData(result.data);
          this.setState({
            isLoading: false,
            ...this.dataManager.getRenderState(),
            query
          }, () => {
            callback && callback();
          });
        });
      });
    }
  }

  onRowSelected = (event, path, dataClicked) => {
    this.dataManager.changeRowSelected(event.target.checked, path);
    this.setState(this.dataManager.getRenderState(), () => this.onSelectionChange(dataClicked));
  }

  onSelectionChange = (dataClicked) => {
    if (this.props.onSelectionChange) {
      const selectedRows = [];

      const findSelecteds = list => {
        list.forEach(row => {
          if (row.tableData.checked) {
            selectedRows.push(row);
          }

          row.tableData.childRows && findSelecteds(row.tableData.childRows);
        });
      };

      findSelecteds(this.state.originalData);
      this.props.onSelectionChange(selectedRows, dataClicked);
    }
  }

  onSearchChangeDebounce = debounce((searchText) => {
    if (this.isRemoteData()) {
      const query = { ...this.state.query };
      query.page = 0;
      query.search = searchText;

      this.onQueryChange(query);
    }
    else {
      this.setState(this.dataManager.getRenderState(), () => {
        this.props.onSearchChange && this.props.onSearchChange(searchText);
      });
    }
  }, this.props.options.debounceInterval)

  // long.toquoc modified
  onFilterChange = (columnId, value, isEnter) => {
    this.dataManager.changeFilterValue(columnId, value);
    this.setState({}, this.onFilterChangeDebounce(columnId, isEnter));
  }

  // long.toquoc modified
  onFilterChangeDebounce = (columnId, isEnter) => debounce(() => {
    if (this.isRemoteData()) {
      const query = { ...this.state.query };
      query.page = 0;
      query.filters = this.state.columns
        // LCD modified
        .filter(a => a.tableData.filterValue || a.tableData.id === columnId)
        .map(a => ({
          column: a,
          operator: "=",
          value: a.tableData.filterValue,
          editing: a.tableData.id === columnId
        }));
      // long.toquoc add
      // this.props.onFilterChange && this.props.onFilterChange(query);
      this.onQueryChange(query, null, isEnter);
    }
    else {
      this.setState(this.dataManager.getRenderState(), () => {
        if (this.props.onFilterChange) {
          const appliedFilters = this.state.columns
            // LCD modified
            .filter(a => a.tableData.filterValue || a.tableData.id === columnId)
            .map(a => ({
              column: a,
              operator: "=",
              value: a.tableData.filterValue,
              editing: a.tableData.id === columnId
            }));
          this.props.onFilterChange(appliedFilters);
        }
      });
    }
  }, this.props.options.debounceInterval)

  onTreeExpandChanged = (path, data) => {
    this.dataManager.changeTreeExpand(path);
    this.setState(this.dataManager.getRenderState(), () => {
      this.props.onTreeExpandChange && this.props.onTreeExpandChange(data, data.tableData.isTreeExpanded);
    });
  }

  onToggleDetailPanel = (path, render) => {
    this.dataManager.changeDetailPanelVisibility(path, render);
    this.setState(this.dataManager.getRenderState());
  }

  onCellEditStarted = (rowData, columnDef) => {
    this.dataManager.startCellEditable(rowData, columnDef);
    this.setState(this.dataManager.getRenderState());
  };

  onCellEditFinished = (rowData, columnDef) => {
    this.dataManager.finishCellEditable(rowData, columnDef);
    this.setState(this.dataManager.getRenderState());
  };

  onEditRowDataChanged = (rowData, newData) => {
    this.dataManager.setEditRowData(rowData, newData);
    this.setState(this.dataManager.getRenderState());
  };



  renderFooter() {
    const props = this.getProps();
    if (props.options.paging) {
      const localization = { ...MaterialTable.defaultProps.localization.pagination, ...this.props.localization.pagination };

      const isOutsidePageNumbers = this.isOutsidePageNumbers(props);
      const currentPage = isOutsidePageNumbers
        ? Math.min(props.page, Math.floor(props.totalCount / this.state.pageSize))
        : this.state.currentPage;
      const totalCount = isOutsidePageNumbers
        ? props.totalCount
        : this.state.data.length;

      return (
        <Table>
          <TableFooter style={{ display: 'grid' }}>
            <TableRow>
              <props.components.Pagination
                classes={{
                  root: props.classes.paginationRoot,
                  toolbar: props.classes.paginationToolbar,
                  caption: props.classes.paginationCaption,
                  selectRoot: props.classes.paginationSelectRoot,
                }}
                style={{ float: props.theme.direction === "rtl" ? "" : "right", overflowX: 'auto' }}
                colSpan={3}
                count={this.isRemoteData() ? this.state.query.totalCount : totalCount}
                icons={props.icons}
                rowsPerPage={this.state.pageSize}
                rowsPerPageOptions={props.options.pageSizeOptions}
                SelectProps={{
                  renderValue: (value) => {
                    // LCD modified
                    if (value > 0) {
                      return <div style={{ padding: '0px 5px' }}>{value + ' ' + localization.labelRowsSelect + ' '}</div>
                    } else {
                      let index = props.options.pageSizeOptions.findIndex(element => element.value === value)
                      let label = props.options.pageSizeOptions[index].label
                      return <div style={{ padding: '0px 5px' }}>{label}</div>
                    }
                  }
                }}
                page={this.isRemoteData() ? this.state.query.page : currentPage}
                onPageChange={this.onPageChange}
                onRowsPerPageChange={this.onRowsPerPageChange}
                ActionsComponent={(subProps) => props.options.paginationType === 'normal' ?
                  <MTablePagination {...subProps} icons={props.icons} localization={localization} showFirstLastPageButtons={props.options.showFirstLastPageButtons} /> :
                  <MTableSteppedPagination {...subProps} icons={props.icons} localization={localization} showFirstLastPageButtons={props.options.showFirstLastPageButtons} />}
                labelDisplayedRows={(row) => localization.labelDisplayedRows.replace('{from}', row.from).replace('{to}', row.to).replace('{count}', row.count)}
                labelRowsPerPage={localization.labelRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      );
    }
  }

  renderTable = (props) => (
    // long.toquoc add "props.options.fixedColumns ? 'auto'"
    <TableContainer style={{ maxHeight: props.options.fixedColumns ? 'auto' : props.options.tableMaxHeight, minWidth: Math.max(this.getAllColumnsWidth(props), this.state.viewWidth), overflowX: 'hidden' }}>
      <Table style={{ tableLayout: (props.options.fixedColumns && (props.options.fixedColumns.left || props.options.fixedColumns.right)) ? 'fixed' : props.options.tableLayout }} stickyHeader={props.options.tableStickyHeader}>
        {
          props.options.header &&
          <props.components.Header
            actions={props.actions}
            localization={{ ...MaterialTable.defaultProps.localization.header, ...this.props.localization.header }}
            columns={this.state.columns}
            hasSelection={props.options.selection}
            headerStyle={props.options.headerStyle}
            icons={props.icons}
            selectedCount={this.state.selectedCount}
            dataCount={
              props.parentChildData ? this.state.treefiedDataLength : (
                (this.state.columns.filter(col => col.tableData.groupOrder > -1).length > 0) ? this.state.groupedDataLength : this.state.data.length
              )
            }
            hasDetailPanel={!!props.detailPanel}
            detailPanelColumnAlignment={props.options.detailPanelColumnAlignment}
            showActionsColumn={props.actions && props.actions.filter(a => a.position === "row" || typeof a === "function").length > 0}
            showSelectAllCheckbox={props.options.showSelectAllCheckbox}
            orderBy={this.state.orderBy}
            orderDirection={this.state.orderDirection}
            onAllSelected={this.onAllSelected}
            onOrderChange={this.onChangeOrder}
            actionsHeaderIndex={props.options.actionsColumnIndex}
            sorting={props.options.sorting}
            grouping={props.options.grouping}
            isTreeData={this.props.parentChildData !== undefined}
            draggable={props.options.draggable}
            thirdSortClick={props.options.thirdSortClick}
            treeDataMaxLevel={this.state.treeDataMaxLevel}
            options={props.options}
            // long.toquoc disable selected row in add/edit/update row mode
            hasAnyEditingRow={!!(this.state.lastEditingRow || this.state.showAddRow)}
          />
        }
        <props.components.Body
          actions={props.actions}
          components={props.components}
          icons={props.icons}
          renderData={this.state.renderData}
          currentPage={this.state.currentPage}
          initialFormData={props.initialFormData}
          pageSize={this.state.pageSize}
          pageSizeOptions={this.state.pageSizeOptions}
          columns={this.state.columns}
          detailPanel={props.detailPanel}
          options={props.options}
          getFieldValue={this.dataManager.getFieldValue}
          isTreeData={this.props.parentChildData !== undefined}
          onFilterChanged={this.onFilterChange}
          onRowSelected={this.onRowSelected}
          onToggleDetailPanel={this.onToggleDetailPanel}
          onGroupExpandChanged={this.onGroupExpandChanged}
          onTreeExpandChanged={this.onTreeExpandChanged}
          onEditingCanceled={this.onEditingCanceled}
          onEditingApproved={this.onEditingApproved}
          localization={{ ...MaterialTable.defaultProps.localization.body, ...this.props.localization.body }}
          onRowClick={this.props.onRowClick}
          showAddRow={this.state.showAddRow}
          hasAnyEditingRow={!!(this.state.lastEditingRow || this.state.showAddRow)}
          hasDetailPanel={!!props.detailPanel}
          treeDataMaxLevel={this.state.treeDataMaxLevel}
          cellEditable={props.cellEditable}
          onCellEditStarted={this.onCellEditStarted}
          onCellEditFinished={this.onCellEditFinished}
          onClickCell={props.onClickCell}
          scrollWidth={this.state.width}
        />
      </Table>
    </TableContainer>
  )

  getAllColumnsWidth = (props) => {
    let result = 0;

    const actionsWidth = CommonValues.actionsColumnWidth(props);
    result += actionsWidth;

    // long.toquoc add to fix CSS
    if (props.detailPanel)
    {
      result += CommonValues.baseIconSize(props);
    }

    if (props.options.selection) {
      const selectionWidth = CommonValues.selectionMaxWidth(props, this.state.treeDataMaxLevel);
      result += selectionWidth;
    }

    for (let i = 0; i < props.columns.length; i++) {
      const colDef = props.columns[i];
      let width = 0;
      if (colDef.tableData) {
        if (typeof colDef.tableData.width === "number") {
          width = colDef.tableData.width;
        }
      }
      else if (colDef.width) {
        if (typeof colDef.width === "number") {
          width = colDef.width;
        }
      }
      result += width;
    }

    // console.log('getAllColumnsWidth', result, 'vs width', this.state.width, 'vs viewWidth', this.state.viewWidth)
    return result;
  }

  getColumnsWidth = (props, count) => {
    let result = [];

    const actionsWidth = CommonValues.actionsColumnWidth(props);
    if (actionsWidth > 0) {
      if (count > 0 && props.options.actionsColumnIndex >= 0 && props.options.actionsColumnIndex < count) {
        result.push(actionsWidth + "px");
      }
      else if (count < 0 && props.options.actionsColumnIndex < 0 && props.options.actionsColumnIndex >= count) {
        result.push(actionsWidth + "px");
      }
    }

    // long.toquoc add to fix CSS
    if (props.detailPanel && count > 0)
    {
      result.push(CommonValues.baseIconSize(props) + "px");
    }

    if (props.options.selection && count > 0) {
      const selectionWidth = CommonValues.selectionMaxWidth(props, this.state.treeDataMaxLevel);
      result.push(selectionWidth + "px");
    }

    count = Math.abs(count) > props.columns.length ? 0 : count

    for (let i = 0; i < Math.abs(count) && i < props.columns.length; i++) {
      const colDef = props.columns[count >= 0 ? i : props.columns.length - 1 - i];
      
      if (colDef.tableData) {
        if (typeof colDef.tableData.width === "number") {
          result.push(colDef.tableData.width + "px");
        }
        else {
          result.push(colDef.tableData.width);
        }
      }
      else if (colDef.width) {
        if (typeof colDef.width === "number") {
          result.push(colDef.width + "px");
        }
        else {
          result.push(colDef.width);
        }
      }
    }
    
    return "calc(" + result.join(' + ') + ")";
  }

  render() {
    const props = this.getProps();

    return (
      <DragDropContext onDragEnd={this.onDragEnd} nonce={props.options.cspNonce}>
        <props.components.Container style={{ position: 'relative', ...props.style }}>
          {props.options.toolbar &&
            <props.components.Toolbar
              actions={props.actions}
              components={props.components}
              selectedRows={this.state.selectedCount > 0 ? this.state.originalData.filter(a => { return a.tableData.checked }) : []}
              columns={this.state.columns}
              columnsButton={props.options.columnsButton}
              icons={props.icons}
              exportAllData={props.options.exportAllData}
              exportButton={props.options.exportButton}
              exportDelimiter={props.options.exportDelimiter}
              exportFileName={props.options.exportFileName}
              exportCsv={props.options.exportCsv}
              getFieldValue={this.dataManager.getFieldValue}
              data={this.state.data}
              renderData={this.state.renderData}
              search={props.options.search}
              showTitle={props.options.showTitle}
              showTextRowsSelected={props.options.showTextRowsSelected}
              toolbarButtonAlignment={props.options.toolbarButtonAlignment}
              searchFieldAlignment={props.options.searchFieldAlignment}
              searchAutoFocus={props.options.searchAutoFocus}
              searchFieldStyle={props.options.searchFieldStyle}
              searchFieldVariant={props.options.searchFieldVariant}
              title={props.title}
              searchText={this.dataManager.searchText}
              onSearchChanged={this.onSearchChangeDebounce}
              dataManager={this.dataManager}
              onColumnsChanged={this.onChangeColumnHidden}
              localization={{ ...MaterialTable.defaultProps.localization.toolbar, ...this.props.localization.toolbar }}
            />
          }
          {props.options.grouping &&
            <props.components.Groupbar
              icons={props.icons}
              localization={{ ...MaterialTable.defaultProps.localization.grouping, ...props.localization.grouping }}
              groupColumns={this.state.columns
                .filter(col => col.tableData.groupOrder > -1)
                .sort((col1, col2) => col1.tableData.groupOrder - col2.tableData.groupOrder)
              }
              onSortChanged={this.onChangeGroupOrder}
              onGroupRemoved={this.onGroupRemoved}
            />
          }
          <ScrollBar double={props.options.doubleHorizontalScroll}>
            <Droppable droppableId="headers" direction="horizontal">
              {(provided, snapshot) => {
                const table = this.renderTable(props);
                return (
                  <div ref={provided.innerRef}>
                    <div ref={this.tableContainerDiv} style={{ maxHeight: props.options.maxBodyHeight, minHeight: props.options.minBodyHeight, overflowY: props.options.overflowY }}>
                      {
                        this.state.width && this.state.width > this.state.viewWidth && props.options.fixedColumns && props.options.fixedColumns.right
                        ?
                        <div style={{ width: this.getColumnsWidth(props, props.options.fixedColumns.right), position: 'absolute', top: 0, right: 0, boxShadow: '-2px 0px 15px rgba(125,147,178,.25)', overflowX: 'hidden', zIndex: 11 }}>
                          <div id={'fixed_right_table'} style={{ width: this.state.width, background: 'white', transform: `translateX(calc(${this.getColumnsWidth(props, props.options.fixedColumns.right)} - 100%))` }}>
                            {table}
                          </div>
                        </div>
                        :
                        null
                      }

                      <div id={'main_table'} >
                        {table}
                      </div>

                      {
                        this.state.width && this.state.width > this.state.viewWidth && props.options.fixedColumns && props.options.fixedColumns.left
                        ?
                        <div style={{ width: this.getColumnsWidth(props, props.options.fixedColumns.left), position: 'absolute', top: 0, left: 0, boxShadow: '2px 0px 15px rgba(125,147,178,.25)', overflowX: 'hidden', zIndex: 11 }}>
                          <div id={'fixed_left_table'} style={{ width: this.state.width, background: 'white' }}>
                            {table}
                          </div>
                        </div> 
                        : 
                        null
                      }
                    </div>
                    {provided.placeholder}
                  </div>
                );
              }}
            </Droppable>

          </ScrollBar>
          {
            (this.state.isLoading || props.isLoading) && props.options.loadingType === "linear" &&
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }}>
                <LinearProgress />
              </div>
            </div>
          }
          {
            // long.toquoc disable renderFooter row in add/edit/update row mode
            !(this.state.lastEditingRow || this.state.showAddRow) && this.renderFooter()
          }
          {
            (this.state.isLoading || props.isLoading) && props.options.loadingType === 'overlay' &&
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', zIndex: 11 }}>
              <props.components.OverlayLoading theme={props.theme} />
            </div>
          }
        </props.components.Container>
      </DragDropContext>
    );
  }
}

var style = () => ({
  horizontalScrollContainer: {
    '& ::-webkit-scrollbar': {
      '-webkit-appearance': 'none'
    },
    '& ::-webkit-scrollbar:horizontal': {
      height: 16
    },
    '& ::-webkit-scrollbar-thumb': {
      borderRadius: 8,
      border: '2px solid white',
      backgroundColor: 'rgba(0, 0, 0, .3)',
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, .5)',
      }
    }
  }
});


const ScrollBar = withStyles(style)(({ double, children, classes }) => {
  if (double) {
    return (
      <DoubleScrollbar>
        {children}
      </DoubleScrollbar>
    );
  }
  else {
    return (
      <div className={classes.horizontalScrollContainer} style={{ overflowX: 'auto', position: 'relative' }}>
        {children}
      </div>
    );
  }
});
