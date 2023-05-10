@echo OFF

REM delete proxy from current process
REM https://stackoverflow.com/questions/13222724/command-line-to-remove-an-environment-variable-from-the-os-level-configuration
set http_proxy=
set https_proxy=

REM delete proxy from NodeJS
call npm config delete proxy
call npm config delete https-proxy

REM install lib
call npm install
