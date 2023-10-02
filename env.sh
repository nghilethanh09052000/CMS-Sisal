#!/bin/bash

mv /etc/nginx/html/__PUBLIC_URL__ /etc/nginx/html/${PUBLIC_URL}
find "/etc/nginx/html/${PUBLIC_URL}/" -regex ".*\.\(js\|html\|json\|css\)" -exec sed -i "s/__PUBLIC_URL__/${PUBLIC_URL}" {} \;
sed -i "s/__PUBLIC_URL__/${PUBLIC_URL}/g" /etc/nginx/sites-available/default

sed -i "s/__PUBLIC_URL__/\${PUBLIC_URL}/g" /etc/nginx/html/${PUBLIC_URL}/env.js
sed -i "s/\"REACT_APP_ENV\": \"\"/\"REACT_APP_ENV\": \"\${REACT_APP_ENV}\"/g" /etc/nginx/html/${PUBLIC_URL}/env.js
sed -i "s/\"REACT_APP_DATA_TRANSFER_KEY\": \"\"/\"REACT_APP_DATA_TRANSFER_KEY\": \"${REACT_APP_DATA_TRANSFER_KEY}\"/g" /etc/nginx/html/${PUBLIC_URL}/env.js 
sed -i "s/\"REACT_APP_DATA_TRANSFER_IV\": \"\"/\"REACT_APP_DATA_TRANSFER_IV\": \"${REACT_APP_DATA_TRANSFER_IV}\"/g" /etc/nginx/html/${PUBLIC_URL}/env.js 
sed -i "s/\"REACT_APP_CMS_USER_URL\": \"\"/\"REACT_APP_CMS_USER_URL\": \"${REACT_APP_CMS_USER_URL}\"/g" /etc/nginx/html/${PUBLIC_URL}/env.js 
sed -i "s/\"REACT_APP_REMOTE_CONFIG_URL\": \"\"/\"REACT_APP_REMOTE_CONFIG_URL\": \"${REACT_APP_REMOTE_CONFIG_URL}\"/g" /etc/nginx/html/${PUBLIC_URL}/env.js 
sed -i "s/\"REACT_APP_SUPPORT_NON_AD_USERS\": \"\"/\"REACT_APP_SUPPORT_NON_AD_USERS\": \"${REACT_APP_SUPPORT_NON_AD_USERS}\"/g" /etc/nginx/html/${PUBLIC_URL}/env.js

nginx -g "daemon off;"