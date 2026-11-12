@echo off
SET JAVA_HOME=C:\Program Files\Java\jdk-21.0.12.1
SET PATH=%JAVA_HOME%\bin;%PATH%
echo Using Java: %JAVA_HOME%
mvn %*
