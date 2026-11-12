package com.cinechain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CineChainApplication {

    public static void main(String[] args) {
        SpringApplication.run(CineChainApplication.class, args);
    }
}
