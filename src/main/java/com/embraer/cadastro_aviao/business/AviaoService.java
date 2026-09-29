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

    public void salvarAviao(Aviao aviao){
        repository.saveAndFlush(aviao);
    }

    public Aviao buscarAviaoPorFabricante(String fabricante){
        return repository.findByFabricante(fabricante).orElseThrow(
                () -> new RuntimeException("Fabricante não encontrado")
        );
    }

    public void deletarAviaoPorNome(String nome){

        repository.deleteByNome(nome);
    }

    public void atualizarAviaoPorId(Integer id,Aviao aviao){
        Aviao aviaoEntity = repository.findById(id).orElseThrow(()->
                new RuntimeException("Aviao não encontrado!"));
        Aviao aviaoAtualizado = Aviao.builder()
            .nome(aviao.getNome() != null ? aviao.getNome() : aviaoEntity.getNome())
            .fabricante(aviao.getFabricante() != null ? aviao.getFabricante() : aviaoEntity.getFabricante())
            .modelo(aviao.getModelo() != null ? aviao.getModelo() : aviaoEntity.getModelo())
            .autonomia(aviao.getAutonomia() != null ? aviao.getAutonomia() : aviaoEntity.getAutonomia())
            .capacidade(aviao.getCapacidade() != null ? aviao.getCapacidade() : aviaoEntity.getCapacidade())
            .id(aviaoEntity.getId())
            .build();

        repository.saveAndFlush(aviaoAtualizado);


    }
}
