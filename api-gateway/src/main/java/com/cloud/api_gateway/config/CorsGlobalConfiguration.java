package com.cloud.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;

@Configuration
public class CorsGlobalConfiguration {

    @Value("${app.cors.allowed-origins:http://localhost:3000}") 
    private String allowedOrigin;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Allow the frontend specifically (or "*" for dev)
        corsConfig.setAllowedOriginPatterns(Arrays.asList(allowedOrigin));
        
        // Allow all standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
        corsConfig.addAllowedMethod("*");
        
        // Allow all headers (Authorization, Content-Type, etc.)
        corsConfig.addAllowedHeader("*");
        
        // Allow credentials (needed if you use cookies later, good practice)
        corsConfig.setAllowCredentials(true);

        // Apply this rule to ALL paths
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}