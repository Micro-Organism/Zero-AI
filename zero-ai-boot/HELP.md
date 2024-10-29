# Getting Started

### Reference Documentation

For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/3.3.4/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/3.3.4/maven-plugin/build-image.html)
* [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/3.3.4/reference/htmlsingle/index.html#actuator)
* [Cloud Bootstrap](https://docs.spring.io/spring-cloud-commons/docs/current/reference/html/)
* [Spring Boot DevTools](https://docs.spring.io/spring-boot/docs/3.3.4/reference/htmlsingle/index.html#using.devtools)
* [Azure OpenAI](https://docs.spring.io/spring-ai/reference/api/clients/azure-openai-chat.html)
* [Amazon Bedrock](https://docs.spring.io/spring-ai/reference/api/bedrock-chat.html)
* [Mistral AI](https://docs.spring.io/spring-ai/reference/api/clients/mistralai-chat.html)
* [Ollama](https://docs.spring.io/spring-ai/reference/api/clients/ollama-chat.html)
* [OpenAI](https://docs.spring.io/spring-ai/reference/api/clients/openai-chat.html)
* [PostgresML](https://docs.spring.io/spring-ai/reference/api/embeddings/postgresml-embeddings.html)
* [Stability AI](https://docs.spring.io/spring-ai/reference/api/clients/image/stabilityai-image.html)
* [Transformers (ONNX) Embeddings](https://docs.spring.io/spring-ai/reference/api/embeddings/onnx.html)
* [Azure AI Search](https://docs.spring.io/spring-ai/reference/api/vectordbs/azure.html)
* [Apache Cassandra Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/apache-cassandra.html)
* [Chroma Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/chroma.html)
* [Elasticsearch Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/elasticsearch.html)
* [Milvus Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/milvus.html)
* [MongoDB Atlas Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/mongodb.html)
* [Neo4j Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/neo4j.html)
* [Oracle Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/oracle.html)
* [PGvector Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/pgvector.html)
* [Pinecone Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/pinecone.html)
* [Qdrant Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/qdrant.html)
* [Redis Search and Query Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/redis.html)
* [Typesense Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/typesense.html)
* [Weaviate Vector Database](https://docs.spring.io/spring-ai/reference/api/vectordbs/weaviate.html)
* [Vertex AI Gemini](https://docs.spring.io/spring-ai/reference/api/clients/vertexai-gemini-chat.html)
* [Vertex AI PaLM2](https://docs.spring.io/spring-ai/reference/api/clients/vertexai-palm2-chat.html)
* [Timefold Solver](https://timefold.ai/docs/timefold-solver/latest/quickstart/spring-boot/spring-boot-quickstart#springBootJavaQuickStart)
* [Spring Web](https://docs.spring.io/spring-boot/docs/3.3.4/reference/htmlsingle/index.html#web)

### Guides

The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service with Spring Boot Actuator](https://spring.io/guides/gs/actuator-service/)
* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)

### Additional Links

These additional references should also help you:

* [Timetabling sample. Assign lessons to timeslots and rooms to produce a better schedule for teachers and students](https://github.com/TimefoldAI/timefold-quickstarts/tree/stable/technology/java-spring-boot)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the
parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

