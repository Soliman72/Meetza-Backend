#!/bin/bash

# Determine if we should use local or external MariaDB
if [ "$DB_HOST" = "db" ] || [ "$DB_HOST" = "172.17.0.1" ]; then
    echo "Using external database at $DB_HOST. Skipping internal MariaDB startup."
else
    echo "Starting MariaDB..."
    /etc/init.d/mariadb start

    echo "Waiting for database to start..."
    while ! mysqladmin ping -u root -h localhost --silent; do
        sleep 1
    done
    sleep 2 # Give it a moment to fully initialize grant tables

    # Initialize database if it hasn't been initialized
    if [ ! -d "/var/lib/mysql/meetza" ]; then
        echo "Initializing database..."
        mysql -u root -e "CREATE DATABASE IF NOT EXISTS meetza;"
        
        # Update root user password and grant privileges
        mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'rootpassword'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' IDENTIFIED BY 'rootpassword' WITH GRANT OPTION; GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'rootpassword' WITH GRANT OPTION; FLUSH PRIVILEGES;"
        
        # Import schema
        echo "Importing database schema..."
        (echo "SET FOREIGN_KEY_CHECKS=0;" && cat /app/database_schema.sql) | mysql -u root -prootpassword meetza
        echo "Database schema imported successfully."
    fi

    # Set environment variables for local DB
    export DB_HOST=127.0.0.1
    export DB_PORT=3306
    export DB_USER=root
    export DB_PASSWORD="rootpassword"
    export DB_NAME=meetza
fi

echo "Starting Node.js server..."
exec npm run start
