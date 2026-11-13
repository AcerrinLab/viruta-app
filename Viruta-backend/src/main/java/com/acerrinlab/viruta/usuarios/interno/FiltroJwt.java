package com.acerrinlab.viruta.usuarios.interno;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Lee el token de la cabecera Authorization y deja la sesion disponible para la peticion. */
class FiltroJwt extends OncePerRequestFilter {

    private final ServicioJwt jwt;

    FiltroJwt(ServicioJwt jwt) {
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest peticion, HttpServletResponse respuesta, FilterChain cadena)
            throws ServletException, IOException {
        String token = null;
        String cabecera = peticion.getHeader("Authorization");
        if (cabecera != null && cabecera.startsWith("Bearer ")) {
            token = cabecera.substring(7);
        } else if (peticion.getRequestURI().endsWith("/api/eventos")) {
            // EventSource del navegador no permite cabeceras: el canal en tiempo real recibe el token por parametro.
            token = peticion.getParameter("token");
        }
        jwt.validar(token).ifPresent(sesion -> SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(sesion, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + sesion.rol().name())))));
        cadena.doFilter(peticion, respuesta);
    }
}
