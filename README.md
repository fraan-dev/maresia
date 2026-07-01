# MaresIA: Mapeamento Inteligente de Resíduos Costeiros

O **MaresIA** é um projeto acadêmico desenvolvido por estudantes do IFRN Campus Canguaretama. A aplicação permite mapear denúncias de resíduos nas praias de Baía Formosa e Barra de Cunhaú, no Rio Grande do Norte.

## Problemática ambiental

O acúmulo de resíduos sólidos no litoral ameaça a biodiversidade marinha, gera contaminação por microplásticos e prejudica o turismo. O projeto centraliza registros georreferenciados para ajudar a identificar os locais que precisam de atenção.

## Funcionalidades

- Registro de denúncias com foto, categoria, comentário e localização.
- Mapa OpenStreetMap com pontos pendentes e resolvidos.
- Localização pelo GPS ou marcação manual.
- Pontos comunitários independentes da tabela de denúncias.
- Alteração de status e exclusão de registros.
- Interface responsiva para computadores e celulares.
- Persistência das denúncias em banco H2 por meio de API REST.

## Tecnologias

- HTML, CSS e JavaScript
- Leaflet e OpenStreetMap
- Java 17
- Spring Boot 3
- Spring Data JPA
- Banco de dados H2

## Requisitos

- Java 17 ou superior
- Maven 3.9 ou superior
- Internet para baixar as dependências e carregar o mapa

## Executar

```powershell
mvn spring-boot:run
```

Abra [http://localhost:8080](http://localhost:8080). A geolocalização funciona em `localhost` ou HTTPS.

## Banco de dados e API

As denúncias são gravadas em `data/maresia.mv.db`. O schema é atualizado automaticamente sem apagar os registros.

- API: `http://localhost:8080/api/reports`
- Console H2: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/maresia`
- Usuário: `sa`
- Senha: vazia

Os pontos livres do mapa são separados das denúncias e permanecem armazenados no navegador.

## Integrantes do grupo

- Israel Cipriano — [Israelf1lho](https://github.com/Israelf1lho)
- Frankwellington Bezerra — [frankwellington](https://github.com/frankwellington)
- Pedro Henrique — [Henrriks](https://github.com/Henrriks)

---

Projeto desenvolvido para fins acadêmicos no IFRN — Campus Canguaretama.
