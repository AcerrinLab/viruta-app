package com.acerrinlab.viruta;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/**
 * RNF-06: los modulos se comunican solo por sus interfaces publicas o por eventos.
 * Ningun modulo puede importar el paquete "interno" de otro.
 */
class ArquitecturaModulosTest {

    private static final Path RAIZ = Path.of("src/main/java/com/acerrinlab/viruta");
    private static final Pattern IMPORTA_INTERNO = Pattern.compile("import\\s+(?:static\\s+)?com\\.acerrinlab\\.viruta\\.(\\w+)\\.interno\\.");

    @Test
    void ningunModuloImportaElPaqueteInternoDeOtro() throws IOException {
        List<String> violaciones = new ArrayList<>();
        try (Stream<Path> archivos = Files.walk(RAIZ)) {
            for (Path archivo : archivos.filter(p -> p.toString().endsWith(".java")).toList()) {
                Path relativo = RAIZ.relativize(archivo);
                String modulo = relativo.getNameCount() > 1 ? relativo.getName(0).toString() : "";
                Matcher m = IMPORTA_INTERNO.matcher(Files.readString(archivo));
                while (m.find()) {
                    if (!m.group(1).equals(modulo)) {
                        violaciones.add(relativo + " importa el interno de " + m.group(1));
                    }
                }
            }
        }
        assertTrue(violaciones.isEmpty(), String.join("\n", violaciones));
    }

    @Test
    void estanLosSieteModulosDelMonolito() {
        for (String modulo : List.of("usuarios", "diseno", "materiales", "carpinterias", "pedidos", "pagos", "notificaciones")) {
            assertTrue(Files.isDirectory(RAIZ.resolve(modulo)), "Falta el modulo " + modulo);
        }
    }
}
