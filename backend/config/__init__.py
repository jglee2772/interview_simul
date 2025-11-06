"""
파일: __init__.py
역할: 패키지 초기화
설명:
- pymysql을 사용하여 MySQL 연결 설정
- MySQL Workbench와 연결해서 사용하므로 pymysql 사용
- mysqlclient 대신 pymysql 사용
"""

# pymysql을 MySQLdb로 사용하도록 설정
import pymysql
pymysql.install_as_MySQLdb()
