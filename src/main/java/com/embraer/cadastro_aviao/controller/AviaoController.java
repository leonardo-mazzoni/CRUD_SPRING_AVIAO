package com.embraer.cadastro_aviao.controller;

import com.embraer.cadastro_aviao.business.AviaoService;
import com.embraer.cadastro_aviao.infrastructure.entitys.Aviao;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        // é como o crud - aqui é o create
        // é void pois ele não retorna dados, apenas um código de erro (já que está criando algo)
        // nao é o mais adequado (mais adequado é utilizar DTO)
        // -> exemplo da senha
    }

    @GetMapping
    public ResponseEntity<Aviao> buscarAviaoPorNome(@RequestParam String nome){
        return ResponseEntity.ok(aviaoService.buscarAviaoPorNome(nome));
    }

    @DeleteMapping
    public ResponseEntity<Void> deletarAviaoPorNome(@RequestParam String nome){
        aviaoService.deletarAviaoPorNome(nome);
        return ResponseEntity.ok().build();
    }

    // put - atualiza o objeto inteiro
    //  "pet?" atualiza apenas um

    @PutMapping
    public ResponseEntity<Void> atualizarAviaoPorId(@RequestBody Aviao aviao,
                                                    @RequestParam Integer id){
        aviaoService.atualizarAviaoPorId(id, aviao);
        return ResponseEntity.ok().build();
        // aqui sao dois parametros pois: 1 atualiza o objeto aviao 2 - pega o ID do avio que será atualizado
    }

}
