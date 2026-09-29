package com.embraer.cadastro_aviao.controller;

import com.embraer.cadastro_aviao.business.AviaoService;
import com.embraer.cadastro_aviao.infrastructure.entitys.Aviao;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//perceba! sao bibliotecas diferentes
@RestController
@RequestMapping("/Aviao")
@RequiredArgsConstructor
public class AviaoController {

    private final AviaoService aviaoService;

    // é como o insert para web
    @PostMapping
    public ResponseEntity<Void> salvarAviao(@RequestBody Aviao aviao){
        aviaoService.salvarAviao(aviao);
        return ResponseEntity.ok().build();
        // nao é o mais adequado (mais adequado é utilizar DTO)
        // -> exemplo da senha
    }
}
