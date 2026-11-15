package com.acerrinlab.viruta.compartido;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;

/**
 * Las bases creadas antes guardaban los enums como columnas ENUM con los valores de ese momento.
 * Al sumar un valor nuevo (por ejemplo RELICARIO) la base lo rechazaba. La migracion las pasa a VARCHAR.
 */
class MigracionEnumsTest {

    private static JdbcDataSource base(String nombre) {
        JdbcDataSource ds = new JdbcDataSource();
        ds.setURL("jdbc:h2:mem:" + nombre + ";MODE=MySQL;DB_CLOSE_DELAY=-1");
        ds.setUser("sa");
        return ds;
    }

    private static String tipo(Connection c, String tabla, String columna) throws SQLException {
        try (ResultSet rs = c.getMetaData().getColumns(null, null, tabla.toUpperCase(), columna.toUpperCase())) {
            rs.next();
            return rs.getString("TYPE_NAME");
        }
    }

    @Test
    void pasaLasColumnasEnumAVarcharYAceptaValoresNuevos() throws Exception {
        JdbcDataSource ds = base("migracion1");
        try (Connection c = ds.getConnection(); Statement s = c.createStatement()) {
            s.execute("create table proyectos (id bigint, plantilla enum('BAJO_MESADA','ESTANTE','MESA') not null)");
            assertThrows(SQLException.class, () -> s.execute("insert into proyectos values (1, 'RELICARIO')"));

            int cambiadas = new MigracionEnums(ds).migrar();

            assertEquals(1, cambiadas);
            assertEquals("CHARACTER VARYING", tipo(c, "proyectos", "plantilla"));
            assertDoesNotThrow(() -> s.execute("insert into proyectos values (2, 'RELICARIO')"));
            assertThrows(SQLException.class, () -> s.execute("insert into proyectos values (3, null)"),
                    "se mantiene el NOT NULL");
        }
    }

    @Test
    void siYaEstaMigradaNoHaceNada() throws Exception {
        JdbcDataSource ds = base("migracion2");
        try (Connection c = ds.getConnection(); Statement s = c.createStatement()) {
            s.execute("create table pedidos (id bigint, estado varchar(40))");
        }
        assertEquals(0, new MigracionEnums(ds).migrar());
    }

    @Test
    void siFaltanTablasNoFalla() {
        assertEquals(0, assertDoesNotThrow(() -> new MigracionEnums(base("migracion3")).migrar()));
    }
}
