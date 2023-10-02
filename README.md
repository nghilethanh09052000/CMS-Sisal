# API:

# Setup Enviroments
    I. Install NodeJS
        We use nvm to manage nodejs version
        1. Download and install nvm (https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/)
        2. Instal nodejs version 14.17.0:
            - For Windows (Open Command Prompt as Admintrator and run the below commands): 
                + nvm install 14.17.0
                + nvm use 14.17.0
            - For MacOS (Open Teminal and run the below commands):
                + export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
                [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                + nvm install 14.17.0
                + nvm use 14.17.0

    II. Download and install Visual Studio Code
        1. For Windows: https://code.visualstudio.com/docs/?dv=win
        2. For MacOS: https://code.visualstudio.com/docs/?dv=osx

# Setup CMS project
    I. Checkout and configuration CMS project
        1. Checkout src from https://git.gameloft.org/g4b_be/sisal/sisal-microservices/cms-frontend-service (alpha branch)
        2. Open CMS project via Visual Studio Code
        3. In root folder, make a file ".env" with content as below
            PORT=3003
            GENERATE_SOURCEMAP=false
            PUBLIC_URL='/cms'
            REACT_APP_VERSION=$npm_package_version
            REACT_APP_NAME=$npm_package_name
            REACT_APP_ENV='alpha'
            REACT_APP_SUPPORT_NON_AD_USERS=true
            REACT_APP_REMOTE_CONFIG_URL='request Backend team for information'
            REACT_APP_CMS_USER_URL='request Backend team for information'
            REACT_APP_DATA_TRANSFER_KEY='request Backend team for information'
            REACT_APP_DATA_TRANSFER_IV='request Backend team for information'
        4. Install Libs Reactjs Dependencies (Visual Studio Code -> Teminal -> New Teminal)
            - For Windows
                + .\install.bat
            - For MacOS
                + bash install.sh
    
# Running (Visual Studio Code -> Teminal -> New Teminal)
1. For Windows
    + .\run.bat
2. For MacOS
    + bash run.sh