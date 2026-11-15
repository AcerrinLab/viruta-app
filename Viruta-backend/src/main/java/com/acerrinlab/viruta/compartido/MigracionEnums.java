package com.acerrinlab.viruta.compartido;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Locale;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Hibernate creaba los enums como columnas ENUM (en H2 y MySQL) con los valores de ese momento, y
 * ddl-auto=update no las vuelve a tocar. Por eso un valor nuevo, como la plantilla RELICARIO, era
 * rechazado por la base. Al arrancar, esta migracion pasa esas columnas a VARCHAR(40) conservando
 * el NOT NULL. Las entidades ya mapean los enums como VARCHAR, asi que en bases nuevas no hace nada.
 */
@Component
@Order(0)
public class MigracionEnums implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MigracionEnums.class);

    /** Tabla y columna de cada enum persistido. */
    private static final List<String[]> COLUMNAS = List.of(
            new String[] { "usuarios", "rol" },
            new String[] { "carpinterias", "zona" },
            new String[] { "carpinteria_materiales", "material" },
            new String[] { "proyectos", "plantilla" },
            new String[] { "proyectos", "material" },
            new String[] { "proyectos", "color" },
            new String[] { "pedidos", "estado" },
            new String[] { "pedidos", "plantilla" },
            new String[] { "pedidos", "material" },
            new String[] { "pedidos", "color" });

    private final DataSource datos;

    public MigracionEnums(DataSource datos) {
        this.datos = datos;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int cambiadas = migrar();
            if (cambiadas > 0) {
                log.info("Migracion: {} columnas ENUM pasadas a VARCHAR", cambiadas);
            }
        } catch (SQLException e) {
            log.warn("No se pudo revisar las columnas ENUM: {}", e.getMessage());
        }
    }

    /** Devuelve cuantas columnas cambio. */
    public int migrar() throws SQLException {
        int cambiadas = 0;
        try (Connection c = datos.getConnection()) {
            DatabaseMetaData meta = c.getMetaData();
            boolean mysql = meta.getDatabaseProductName().toLowerCase(Locale.ROOT).contains("mysql");
            for (String[] col : COLUMNAS) {
                Columna actual = buscar(meta, c.getCatalog(), col[0], col[1]);
                if (actual == null || !actual.tipo().toUpperCase(Locale.ROOT).contains("ENUM")) {
                    continue;
                }
                String sql = mysql
                        ? "ALTER TABLE " + col[0] + " MODIFY COLUMN " + col[1] + " VARCHAR(40)" + (actual.nula() ? " NULL" : " NOT NULL")
                        : "ALTER TABLE " + col[0] + " ALTER COLUMN " + col[1] + " SET DATA TYPE VARCHAR(40)";
                try (Statement s = c.createStatement()) {
                    s.execute(sql);
                    cambiadas++;
                    log.info("Columna {}.{} pasada de ENUM a VARCHAR", col[0], col[1]);
                } catch (SQLException e) {
                    log.warn("No se pudo migrar {}.{}: {}", col[0], col[1], e.getMessage());
                }
            }
        }
        return cambiadas;
    }

    private record Columna(String tipo, boolean nula) {
    }

    /**
     * Busca la columna sin importar mayusculas (H2 guarda en mayusculas, MySQL como se creo), solo en la
     * base actual: si el servidor tiene otra base con tablas del mismo nombre, no la toca.
     */
    private static Columna buscar(DatabaseMetaData meta, String base, String tabla, String columna) throws SQLException {
        for (String t : List.of(tabla, tabla.toUpperCase(Locale.ROOT))) {
            for (String n : List.of(columna, columna.toUpperCase(Locale.ROOT))) {
                try (ResultSet rs = meta.getColumns(base, null, t, n)) {
                    if (rs.next()) {
                        return new Columna(rs.getString("TYPE_NAME"), rs.getInt("NULLABLE") != DatabaseMetaData.columnNoNulls);
                    }
                }
            }
        }
        return null;
    }
}
