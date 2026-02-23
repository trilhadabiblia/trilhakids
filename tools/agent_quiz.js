import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/quiz", async (req, res) => {
  const { livro, contexto } = req.body;

                const response = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": "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",
                        "anthropic-version": "2023-06-01",
                    },
                    body: JSON.stringify({
                        model: "claude-sonnet-4-20250514",
                        max_tokens: 4000,
                        messages: [
                            {
                                role: "user",
                                content: `Você é um especialista em educação bíblica infantil. Crie 10 perguntas de múltipla escolha sobre o livro de ${livro} da Bíblia para crianças de 8-12 anos.

Contexto do livro que será abordado nas perguntas:
${contexto}

IMPORTANTE: Retorne APENAS um JSON válido, sem qualquer texto adicional, markdown ou explicações. O JSON deve seguir EXATAMENTE este formato:

{
  "questoes": [
    {
      "pergunta": "texto da pergunta",
      "opcoes": ["opção 1", "opção 2", "opção 3", "opção 4"],
      "correta": 0,
      "justificativa": "explicação da resposta correta"
    }
  ]
}

Diretrizes:
- Perguntas adequadas para crianças (linguagem simples e clara)
- 4 opções de resposta por pergunta
- O índice "correta" vai de 0 a 3 (índice do array de opções)
- Justificativas educativas e encorajadoras
- Variar níveis de dificuldade (fácil, médio, difícil)
- Focar nos principais eventos, personagens e lições do livro
- Incluir perguntas sobre versículos-chave quando apropriado`
                            }
                        ]
                    })
                });
				
  const data = await response.json();
  res.json(data);
});

app.listen(3001, () => console.log("✅ API rodando em http://localhost:3001"));
