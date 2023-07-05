FROM nginx

COPY ./dist /usr/share/nginx/html
RUN chmod  -R 777 /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
