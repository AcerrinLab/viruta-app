# Etapa 1: compila y corre las pruebas
FROM maven:3.9-eclipse-temurin-21 AS compilacion
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package

# Etapa 2: imagen liviana solo con el .jar
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 viruta
COPY --from=compilacion /app/target/viruta-backend-*.jar app.jar
USER viruta
EXPOSE 8080
# Ajustes para servidores chicos (planes gratis, 512 MB o menos):
# - MaxRAMPercentage: Java usa hasta el 75% de la memoria del contenedor en lugar de calcular mal y morir por falta de memoria.
# - UseSerialGC: el recolector mas liviano, ideal con 1 CPU.
# (Se probo TieredStopAtLevel=1 para arrancar mas rapido: en las mediciones no mejoro, asi que no se usa.)
# - ExitOnOutOfMemoryError: si se queda sin memoria, se reinicia limpio en vez de quedar colgado.
# Se pueden cambiar sin reconstruir la imagen con la variable JAVA_TOOL_OPTIONS en la plataforma.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["java", "-jar", "app.jar"]
