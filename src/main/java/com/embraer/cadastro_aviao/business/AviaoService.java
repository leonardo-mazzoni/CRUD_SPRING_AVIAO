//seria nosso dao
package com.embraer.cadastro_aviao.business;

import com.embraer.cadastro_aviao.infrastructure.entitys.Aviao;
import com.embraer.cadastro_aviao.infrastructure.repository.AviaoRepository;
import org.springframework.stereotype.Service;

@Service
public class AviaoService {
    private final AviaoRepository repository;

    public AviaoService(AviaoRepository repository) {
        this.repository = repository;
    }

    public void SalvarAviao(Aviao aviao){
        repository.saveAndFlush(aviao);
    }

    public Aviao buscarAviaoPorFabricante(String fabricante){
        return repository.findByFabricante(fabricante).orElseThrow(
                () -> new RuntimeException("Fabricante não encontrado")
        );
    }
}
