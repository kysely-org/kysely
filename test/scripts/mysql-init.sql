CREATE USER IF NOT EXISTS 'kysely'@'%' IDENTIFIED BY 'kysely';
GRANT ALL ON *.* TO 'kysely'@'%';
CREATE DATABASE IF NOT EXISTS kysely_test;
