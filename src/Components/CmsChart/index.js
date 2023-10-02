import React from 'react'
import PropTypes from 'prop-types';
import * as _ from 'lodash'

import { ResponsiveLine } from "@nivo/line"
import { getOrdinalColorScale } from '@nivo/colors'
import { Theme } from '@nivo/core'
import { TableTooltip } from '@nivo/tooltip'

import { withMultipleStyles } from '../../Styles'
import moment from 'moment';
import TEXT from './Data/Text';

const chartTheme: Theme = {
	axis: {
		legend: {
			text: {
				// fill: 'green'
				pointerEvents: 'none',
				userSelect: 'none'
			}
		},
		ticks: {
			text: {
				// fill: 'blue'
				pointerEvents: 'none',
				userSelect: 'none'
			}
		}
	}
}

const style = (theme) => ({
	divChart: {
		position: 'absolute',
		left: 0,
		top: 0,
		right: 0,
		bottom: 0
	},
	chart: {
		'--innerWidth': 'calc(100%)',
		'--innerHeight': 'calc(100%)',
		width: 'calc(var(--innerWidth))',
		height: 'calc(var(--innerHeight))',
		position: 'absolute',
		top: 0,
		left: 0,
	},
	center: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
		fontSize: '0.875rem'
	}
})

const Chip = ({ color }) => (
    <span style={{ display: 'block', width: '12px', height: '12px', background: color }} />
)

const SliceTooltip = ({ slice, axis }) => {
    const otherAxis = axis === 'x' ? 'y' : 'x'

    return (
        <TableTooltip
            rows={slice.points.map(point => [
                <Chip key="chip" color={point.serieColor} />,
                point.serieId,
                <strong key="value">{point.data[`${otherAxis}Formatted`]}</strong>,
            ])}
        />
    )
}

const Legends = [
	{
		anchor: "right",
		direction: 'column', //legendDirection,
		justify: false,
		translateX: 140,
		translateY: 0,
		itemsSpacing: 0,
		itemDirection: "left-to-right",
		itemWidth: 80,
		itemHeight: 20,
		itemOpacity: 0.75,
		symbolSize: 12,
		symbolShape: "circle",
		symbolBorderColor: "rgba(0, 0, 0, .5)",
		effects: [
			{
				on: "hover",
				style: {
					itemBackground: "rgba(0, 0, 0, .03)",
					itemOpacity: 1
				}
			}
		]
	}
]

class CmsChart extends React.Component
{
	shouldComponentUpdate(nextProps, nextSate)
	{
		return nextProps.data !== this.props.data
	}

	generateTickValues = (num) =>
	{
		let step = Math.max(parseInt(num / 10), 1)
		let max = parseInt(num / step) * step + step

		let values = Array.from(Array(max + 1).keys()).reduce((arr, value) =>
		{
			// console.log(value, step)
			if (value % step === 0)
			{
				arr.push(value)
			}
			return arr
		}, [])

		// console.log(values, max)

		return {
			max,
			values
		}
	}

	render()
	{
		// console.log('CmsChart', this.props);
		const { classes, data, legends, legendAxisLeft, formatTime, marginChart, sliceTooltip } = this.props

		if (!data)
		{
			return null
		}

		const MIN_Y = 10

		let keysX = []
		let maxYValue = 0

		let nomalizeData = data.reduceRight((arr, value, index) =>
		{
			value.data.forEach(row =>
			{
				if (!_.find(keysX, { x: row.x, y: null }))
				{
					keysX.push({ x: row.x, y: null })
				}
				if (row.y > maxYValue)
				{
					maxYValue = row.y
				}
			})

			if (index === 0)
			{
				// fixed: chart not sort by date on axis-X
				let result = _.sortBy(keysX, obj =>
				{
					let date = moment.utc(obj.x, formatTime)
					if (date.isValid())
					{
						let seconds = Number(date.format("X"))
						return seconds
					}

					return obj.x
				})
				// push at 0 index
				return [
					{
						id: "",
						data: result
					},
					value,
					...arr
				]
			}

			// push at 0 index
			return [value, ...arr]
		}, [])

		// console.log('nomalizeData', nomalizeData)

		if (nomalizeData.length === 0)
		{
			return (
				<div className={classes.divChart}>
					<div className={classes.chart}>
						<div className={classes.center}>{TEXT.NO_DATA_SOURCE_TITLE}</div>
					</div>
				</div>
			)
		}

		let generate = maxYValue < MIN_Y ? this.generateTickValues(maxYValue) : null

		return (
			<div className={classes.divChart}>
				<div className={classes.chart}>
					<ResponsiveLine
						theme={chartTheme}
						enableSlices={'x'}
						sliceTooltip={sliceTooltip}
						data={nomalizeData}
						layers={[
							"grid",
							"markers",
							"axes",
							"areas",
							"crosshair",
							"lines",
							"points",
							"slices",
							"mesh",
							"legends"
						]}
						enableGridX={false}
						enableGridY={true}
						gridYValues={maxYValue < MIN_Y ? generate.values : undefined}
						margin={marginChart}
						// curve="natural"
						xScale={{
							type: "point"
						}}
						yScale={{
							type: "linear",
							min: 0,
							max: maxYValue < MIN_Y ? generate.max : "auto",
							stacked: !true,
							reverse: false,
						}}
						axisTop={null}
						axisRight={null}
						axisBottom={{
							orient: "bottom",
							tickSize: 0,
							tickPadding: 10,
							tickRotation: -30,
							legend: "",
							legendOffset: 30,
							legendPosition: "middle"
						}}
						axisLeft={{
							orient: "left",
							tickSize: 0,
							tickPadding: 30,
							tickRotation: 0,
							legend: legendAxisLeft,
							legendOffset: -15,
							legendPosition: "middle",
							tickValues: maxYValue < MIN_Y ? generate.values : undefined
						}}
						// colors={{ scheme: 'nivo' }}
						// colors={['transparent', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']}
						// https://github.com/d3/d3-scale-chromatic
						colors={['transparent']
							.concat(getOrdinalColorScale({ scheme: 'nivo' }).scale.range())
							.concat(getOrdinalColorScale({ scheme: 'category10' }).scale.range())
							.concat(getOrdinalColorScale({ scheme: 'paired' }).scale.range())
						}
						pointSize={5}
						pointColor={{ theme: "background" }}
						pointBorderWidth={5}
						pointBorderColor={{ from: "serieColor" }}
						pointLabel="y"
						pointLabelYOffset={-15}
						useMesh={true}
						legends={legends}
					/>
				</div>
			</div>
		)
	}
}

CmsChart.propTypes =
{
	classes: PropTypes.object.isRequired,
	legendDirection: PropTypes.oneOf(['row', 'column']),
	formatTime: PropTypes.string,
	legendAxisLeft: PropTypes.string,
	marginChart: PropTypes.object,
	sliceTooltip: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
	legends: PropTypes.arrayOf(PropTypes.object)
}

CmsChart.defaultProps = {
	legendDirection: 'row',
	formatTime: 'MMM DD YYYY',
	legendAxisLeft: 'People',
	marginChart: { top: 30, right: 400, bottom: 60, left: 70 },
	sliceTooltip: SliceTooltip,
	legends: Legends
}

export default withMultipleStyles(style)(CmsChart)