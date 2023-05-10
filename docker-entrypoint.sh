#!/bin/bash

mkdir -p "/etc/nginx/html$PUBLIC_URL/"

cp /usr/src/app/nginx/default /etc/nginx/sites-available/default
sed -i 's@__PUBLIC_URL__@'$PUBLIC_URL'@g' /etc/nginx/sites-available/default

cp -a "/usr/src/app/build/." "/etc/nginx/html$PUBLIC_URL/"
find "/etc/nginx/html$PUBLIC_URL/" -regex ".*\.\(js\|html\|json\|css\)" -exec sed -i 's@__PUBLIC_URL__@'$PUBLIC_URL'@g' {} \;

generateConfigJs(){
    echo "window.env = {";
    for i in `env | grep '^REACT_APP_'`
    do
        key=$(echo "$i" | cut -d"=" -f1);
        val=$(echo "$i" | cut -d"=" -f2);
        echo "  \"${key}\":\"${val}\",";
    done
    echo "  \"PUBLIC_URL\":\"${PUBLIC_URL}\"";
    echo "}";
}
generateConfigJs > "/etc/nginx/html$PUBLIC_URL/env.js"

nginx -g "daemon off;"