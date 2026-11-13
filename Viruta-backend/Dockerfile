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
ENTRYPOINT ["java", "-jar", "app.jar"]
