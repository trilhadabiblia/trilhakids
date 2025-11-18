📘 **1. LIVRO DIGITAL – “Arduino Kids: Aprendendo com Histórias e Personagens”**
=========================================================================================

Formato: **Markdown**  
Pronto para transformar em PDF, e-book ou GitHub Pages.

* * *

📚 _INÍCIO DO LIVRO_
--------------------
<img width="574" height="729" alt="capa" src="https://github.com/user-attachments/assets/bed6b14a-4682-4ff0-96e0-a379cff41074" />

* * *

# 📘 **Arduino Kids – Guia Completo de Projetos Educacionais**

### _Tecnologia, criatividade, histórias e aprendizagem para crianças._

* * *

✨ **Apresentação**
------------------

Este livro foi criado para ajudar escolas, educadores, pais e makers a ensinar eletrônica e programação para crianças usando **Arduino**, com uma abordagem **lúdica**, **criativa** e **alinhada à BNCC**.
Cada projeto possui:
*   Objetivo educacional
    
*   Materiais
    
*   Esquema do circuito
    
*   Código pronto
    
*   História infantil com personagens
    
*   Explicação pedagógica
    
*   Versão para professor e aluno
    

* * *

# 🚀 **SUMÁRIO**

1.  Introdução ao Arduino Kids
    
2.  Como utilizar este livro
    
3.  Metodologia e BNCC
    
4.  Lista dos Personagens
    
5.  Projetos (1 a 10)
    
6.  Versão do Professor
    
7.  Versão do Aluno
    
8.  Créditos
    

* * *

# 🌈 **1. Introdução ao Arduino Kids**

O Arduino Kids nasce para aproximar as crianças da tecnologia de forma divertida e simples, usando histórias, cores, personagens e desafios.

* * *

# 🧭 **2. Como usar este livro**

Cada projeto contém:
*   Idade recomendada
    
*   Competências BNCC
    
*   Esquemático ASCII do circuito
    
*   Código pronto
    
*   História infantil
    
*   Desafios adicionais
    
Educadores podem usar em oficinas, STEAM, clubes de ciências, contraturno, célula maker ou sala de aula.

* * *

# 🏫 **3. Metodologia e BNCC**

Os projetos atendem diferentes competências:

### 🔍 **BNCC atendida**

*   CG2 – Pensamento computacional
    
*   CG3 – Criatividade
    
*   CG5 – Resolução de problemas
    
*   Matemática
    
*   Ciências
    
*   Artes
    
*   Linguagens
    

* * *

# 🎭 **4. Personagens do Arduino Kids**

| Projeto | Personagem |
| --- | --- |
| Luzinha LED | **Luzinha** |
| Planta que Fala | **Senhor Verdinho** |
| Robô Desenhista | **Rabiscop** |
| Jogo de Reflexo | **Capitão Tempo** |
| Bichinho OLED | **Bitina** |
| Piano Kids | **DoRéMi Bot** |
| Livro Interativo | **Sensorito** |
| Detector de Sorrisos | **Risadinha 3000** |
| Semáforo Infantil | **Sinalzinho** |
| Tartaruga RGB | **TurTuga** |

* * *

# 🛠️ **5. PROJETOS COMPLETOS**

A seguir, todos os 10 projetos 100% completos.
_(Aqui eu vou inserir **TODOS** os projetos no formato íntegro, exatamente como desenvolvemos.)_

* * *

# ⭐ **Projeto 1 – Semáforo Infantil com Cores e Sons**

<img width="1024" height="1024" alt="projeto_01" src="https://github.com/user-attachments/assets/62547d2f-a0d1-4099-bdcd-76926315e7cf" />


**Faixa etária:** 6 a 8 anos  
**BNCC:** CG2, CG5, Traços/cores/formas, Matemática (sequência)

* * *

🎒 **Materiais**
----------------

*   1 Arduino Uno
    
*   3 LEDs (vermelho, amarelo, verde)
    
*   3 resistores 220Ω
    
*   1 buzzer
    
*   Jumpers
    
*   Protoboard
    

* * *

🔌 **Esquemático (ASCII)**
--------------------------

```
[LED V] ---- R220 ---- D10
[LED A] ---- R220 ---- D9
[LED G] ---- R220 ---- D8
[BUZZER +] ----------- D7
[BUZZER -] ----------- GND
```

* * *

💻 **Código Arduino**
---------------------

```C++
int ledV = 10;
int ledA = 9;
int ledG = 8;
int buzzer = 7;

void setup() {
  pinMode(ledV, OUTPUT);
  pinMode(ledA, OUTPUT);
  pinMode(ledG, OUTPUT);
  pinMode(buzzer, OUTPUT);
}

void loop() {
  // Vermelho
  digitalWrite(ledV, HIGH);
  tone(buzzer, 500);
  delay(1000);
  noTone(buzzer);
  digitalWrite(ledV, LOW);

  // Amarelo
  digitalWrite(ledA, HIGH);
  delay(700);
  digitalWrite(ledA, LOW);

  // Verde
  digitalWrite(ledG, HIGH);
  delay(1000);
  digitalWrite(ledG, LOW);
}

```

* * *

📖 **História Infantil (Personagem: Luzinho)**
----------------------------------------------

Luzinho era um pequeno LED que ajudava os carros a não se baterem.  
Ele dizia:  
🔴 “Pare!”  
🟡 “Atenção!”  
🟢 “Pode ir!”  
Agora ele precisa da sua ajuda para funcionar direitinho!

* * *

# ⭐ **PROJETO 2 – Planta que Fala (“Senhor Verdinho”)**

<img width="1024" height="1024" alt="projeto_02" src="https://github.com/user-attachments/assets/f44c498d-1a05-49ff-b93c-b51f643ffc8b" />

**Faixa etária:** 6 a 8 anos  
**BNCC:** Ciências (seres vivos), CG2, CG5, Traços e cores

* * *

🎒 Materiais
------------

*   Arduino Uno
    
*   Sensor de umidade do solo (higrômetro SIMPLES)
    
*   1 LED verde
    
*   1 LED vermelho
    
*   2 resistores 220 Ω
    
*   Jumpers
    
*   Protoboard
    

* * *

🔌 Esquemático (ASCII)
----------------------

```
[SENSOR SOLO] → A0
[LED V] ---- R220 ---- D8
[LED R] ---- R220 ---- D9
GND → todos GNDs
5V → VCC sensor
```

* * *

💻 Código Arduino
-----------------

```C++
int sensor = A0;
int ledVerde = 8;
int ledVermelho = 9;

void setup() {
  pinMode(ledVerde, OUTPUT);
  pinMode(ledVermelho, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int valor = analogRead(sensor);
  Serial.println(valor);

  if (valor < 400) { // solo seco
    digitalWrite(ledVermelho, HIGH);
    digitalWrite(ledVerde, LOW);
  } else { // solo úmido
    digitalWrite(ledVermelho, LOW);
    digitalWrite(ledVerde, HIGH);
  }

  delay(500);
}
```

* * *

📖 História Infantil – “Senhor Verdinho”
----------------------------------------

Senhor Verdinho era uma plantinha muito educada.  

Quando estava com sede, ele dizia:

🚨 **“Estou sequinho! Me dá água!”** (acende vermelho)  

💚 **“Ahhh... agora estou feliz!”** (acende verde)

As crianças ajudam Verdinho a viver e aprender sobre cuidado com a natureza!

* * *

# ⭐ **PROJETO 3 – Robô Desenhista Vibrobot (“Rabiscop”)**

<img width="1024" height="1024" alt="projeto_03" src="https://github.com/user-attachments/assets/f4b71e28-ec7b-4848-8d0c-b46fdb262a07" />

**Faixa etária:** 6 a 7 anos  
**BNCC:** Artes (expressão visual), Matemática (movimento), CG3, CG2

* * *

🎒 Materiais
------------

*   Arduino Uno
    
*   Motor DC pequeno
    
*   Transistor 2N2222
    
*   1 resistor 220 Ω
    
*   Fios
    
*   1 copo plástico
    
*   3 canetinhas
    
*   Fita adesiva
    
_(Obs.: Pode funcionar sem Arduino, mas incluí para fins didáticos.)_

* * *

🔌 Esquemático (ASCII)
----------------------

```
D9 ---- R220 ---- Base (2N2222)
Coletor (2N2222) ---- + Motor ---- 5V
Emissor → GND
```

* * *

💻 Código Arduino
-----------------

```C++
int motor = 9;

void setup() {
  pinMode(motor, OUTPUT);
}

void loop() {
  analogWrite(motor, 180); // vibra forte
  delay(1500);
  analogWrite(motor, 120); // vibra fraco
  delay(1000);
}

```

* * *

📖 História Infantil – “Rabiscop, o Robô Artista”
-------------------------------------------------

Rabiscop adorava dançar enquanto desenhava!  

Quando ele ligava seu motorzinho, saia rabiscando alegria por onde passava.  

As crianças criam **quadros de arte aleatória**.

* * *
# ⭐ **PROJETO 4 – Jogo de Reflexo (“Capitão Tempo”)**

<img width="1024" height="1024" alt="projeto_04" src="https://github.com/user-attachments/assets/4d6a2066-2e4c-48b8-a676-abd96b89b79b" />

**Faixa:** 8 a 10 anos  
**BNCC:** Matemática (tempo), Computação, CG2, CG5

* * *

🎒 Materiais
------------

*   Arduino Uno
    
*   1 LED
    
*   1 resistor 220 Ω
    
*   1 botão
    
*   Jumpers
    
*   Protoboard
    

* * *

🔌 Esquemático (ASCII)
----------------------

```
LED + ---- R220 ---- D7
LED - → GND

BOTÃO → D2  
BOTÃO → GND
```

* * *

💻 Código
---------

```C++
int led = 7;
int botao = 2;
unsigned long inicio, tempoReacao;

void setup() {
  pinMode(led, OUTPUT);
  pinMode(botao, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  delay(random(1000, 4000));
  digitalWrite(led, HIGH);
  inicio = millis();

  while(digitalRead(botao) == HIGH) {}

  tempoReacao = millis() - inicio;
  Serial.print("Tempo: ");
  Serial.println(tempoReacao);

  digitalWrite(led, LOW);
  delay(2000);
}
```

* * *

📖 História Infantil – “Capitão Tempo”
--------------------------------------

Capitão Tempo era rápido como um raio!  

Ele desafia as crianças:

⚡ “Quando eu acender… apertem! Vamos ver quem é o mais rápido da turma!”

Trabalha reflexos e coordenação.

* * * 

# ⭐ PROJETO 5 – Bichinho Eletrônico OLED (“Bitina”)
<img width="1024" height="1024" alt="projeto_05" src="https://github.com/user-attachments/assets/2afe8e4e-1273-465e-b625-b008bdfd2583" />

Faixa: 8 a 10 anos
BNCC: Artes (expressões), Emoções, CG3, CG5

🎒 Materiais

Arduino Uno

Display OLED 0.96" I2C

2 botões

Jumpers

Resistores 10k (se necessário)

🔌 Esquemático (ASCII)
```
OLED SDA → A4
OLED SCL → A5
OLED VCC → 5V
OLED GND → GND

BOTÃO1 → D2 (emocao 1)
BOTÃO2 → D3 (emocao 2)
```

💻 Código

(Usa biblioteca Adafruit SSD1306)
```C++
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 tela(128, 64, &Wire);

void setup() {
  tela.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  pinMode(2, INPUT_PULLUP);
  pinMode(3, INPUT_PULLUP);
  tela.clearDisplay();
}

void loop() {
  tela.clearDisplay();

  if (!digitalRead(2)) {
    tela.setCursor(20, 20);
    tela.print(":)");
  } 
  else if (!digitalRead(3)) {
    tela.setCursor(20, 20);
    tela.print(":(");
  } 
  else {
    tela.setCursor(20, 20);
    tela.print(":|");
  }

  tela.display();
}
```

📖 História Infantil – “Bitina, a Carinha Mágica”

Bitina é um bichinho eletrônico que muda de expressão conforme o humor das crianças.

Botão 1 → sorriso 😄

Botão 2 → tristeza 😢

Sem apertar → “pensativa” 🤔

Trabalha emoções e expressão visual.

* * * 

# ⭐ **PROJETO 6 – Piano Infantil (“DoRéMi Bot”)**

<img width="1024" height="1024" alt="projeto_06" src="https://github.com/user-attachments/assets/f9f3acf3-f5bc-43ef-aa1d-04fc60d31e94" />

**Faixa etária:** 6 a 9 anos  
**BNCC:** Artes (sons e ritmos), Matemática (sequências), CG3, CG5

* * *

🎒 Materiais
------------

*   Arduino Uno
    
*   4 botões (para 4 notas)
    
*   4 resistores 10k (pull-down)
    
*   1 buzzer piezo
    
*   Protoboard
    
*   Jumpers
    

* * *

🔌 Esquemático (ASCII)
----------------------

```
BOTÃO 1 → D2  
BOTÃO 2 → D3  
BOTÃO 3 → D4  
BOTÃO 4 → D5  
Cada botão -> resistor de 10k -> GND

BUZZER + → D8  
BUZZER - → GND
```

* * *

💻 Código Arduino
-----------------

```C++
int botoes[] = {2, 3, 4, 5};
int notas[]  = {262, 294, 330, 349}; // dó ré mi fá
int buzzer = 8;

void setup() {
  for (int i = 0; i < 4; i++) {
    pinMode(botoes[i], INPUT_PULLUP);
  }
  pinMode(buzzer, OUTPUT);
}

void loop() {
  for (int i = 0; i < 4; i++) {
    if (!digitalRead(botoes[i])) {
      tone(buzzer, notas[i]);
      delay(300);
      noTone(buzzer);
    }
  }
}

```

* * *

📖 História Infantil – “DoRéMi Bot: O Maestro”
----------------------------------------------

DoRéMi Bot era um robô musical que amava cantar notas coloridas.  
Cada botão era uma cor e uma nota:
🔵 Dó  
🟢 Ré  
🟡 Mi  
🔴 Fá
Ele dizia:  
🎶 _"Toque e crie sua própria música mágica!"_

* * * 

# ⭐ PROJETO 7 – Livro Interativo (“Livro da Luz”)

<img width="1024" height="1024" alt="projeto_07" src="https://github.com/user-attachments/assets/3191e7d9-4b42-4534-848f-da7e063b7717" />

Faixa etária: 7 a 10 anos
BNCC: Linguagem (leitura), Artes (narração), CG2, CG3, CG5

🎒 Materiais

Arduino Uno

1 LDR (sensor de luz)

1 resistor 10k

1 LED amarelo

1 buzzer (efeitos sonoros)

Papel cartão para fazer páginas

Fita dupla face

Jumpers

Protoboard

🔌 Esquemático (ASCII)
```
LDR → 5V  
LDR → A0  
A0 → resistor 10k → GND

LED + → D8  
LED - → GND

BUZZER + → D9  
BUZZER - → GND
```

💻 Código Arduino

```C++
int ldr = A0;
int led = 8;
int buzzer = 9;

void setup() {
  pinMode(led, OUTPUT);
}

void loop() {
  int luz = analogRead(ldr);

  if (luz < 250) { 
    // página de "noite"
    digitalWrite(led, LOW);
    tone(buzzer, 400, 200);
  } else { 
    // página de "dia"
    digitalWrite(led, HIGH);
    noTone(buzzer);
  }

  delay(300);
}
```

📖 História Infantil – “O Livro da Luz”

Era um livro encantado.

Quando abria a página do “dia”, tudo se iluminava.

Quando virava para a página da “noite”, ele tocava uma música suave de mistério.

Sensorito, o grande explorador, guiava as crianças entre páginas mágicas.

* * * 

# ⭐ **PROJETO 8 – Detector de Sorrisos (“Risadinha 3000”)**

<img width="1024" height="1024" alt="projeto_08" src="https://github.com/user-attachments/assets/a27849ea-ecfb-4331-9d59-d74b81de7e9c" />

**Faixa etária:** 8 a 10 anos  
**BNCC:** Corpo e movimentos, expressão, CG5, CG2
_(Usa sensor de distância para “adivinhar” sorrisos quando alguém chega perto.)_

* * *

🎒 Materiais
------------

*   Arduino Uno
    
*   Sensor HC-SR04
    
*   Buzzer
    
*   LED RGB
    
*   Jumpers
    

* * *

🔌 Esquemático (ASCII)
----------------------

```
HC-SR04:
Trig → D9  
Echo → D10  
VCC → 5V  
GND → GND  

LED RGB:
R → D5  
G → D6  
B → D3  
GND → GND

BUZZER + → D7  
BUZZER - → GND
```

* * *

💻 Código Arduino
-----------------

```C++
#define trig 9
#define echo 10
int buzzer = 7;
int r = 5, g = 6, b = 3;

long duracao, distancia;

void setup() {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  pinMode(buzzer, OUTPUT);
  pinMode(r, OUTPUT);
  pinMode(g, OUTPUT);
  pinMode(b, OUTPUT);
}

void loop() {
  digitalWrite(trig, LOW);
  delayMicroseconds(5);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  duracao = pulseIn(echo, HIGH);
  distancia = duracao * 0.034 / 2;

  if (distancia < 20) {
    // sorriso detectado
    tone(buzzer, 600, 200);
    analogWrite(r, 0);
    analogWrite(g, 255);
    analogWrite(b, 0);  // verde
  } else {
    noTone(buzzer);
    analogWrite(r, 0);
    analogWrite(g, 0);
    analogWrite(b, 255); // azul
  }

  delay(200);
}
```

* * *

📖 História Infantil – “Risadinha 3000”
---------------------------------------

Risadinha era um robô que só funcionava quando alguém sorria!  

Quando uma criança chegava perto, ele brilhava verde e tocava uma musiquinha de alegria.

_“Sorria para mim que eu acendo para você!”_ — dizia o risadudo robô.

* * * 

# ⭐ **PROJETO 9 – Semáforo com Botão de Pedestre (“Sinalzinho”)**
 
<img width="1024" height="1024" alt="projeto_09" src="https://github.com/user-attachments/assets/badcb0ff-2356-44fb-b465-532af2a42505" />

**Faixa etária:** 7 a 10 anos  
**BNCC:** Cidadania, trânsito, CG10, matemática (tempo)

* * *

🎒 Materiais
------------

*   Arduino Uno
    
*   LED vermelho
    
*   LED amarelo
    
*   LED verde
    
*   Botão
    
*   Resistores 220 Ω
    
*   Protoboard
    
*   Jumpers
    

* * *

🔌 Esquemático (ASCII)
----------------------

```
LED VERM ---- R220 ---- D10
LED AMAR ---- R220 ---- D9
LED VERD ---- R220 ---- D8

BOTÃO → D2  
BOTÃO → GND
```

* * *

💻 Código Arduino
-----------------

```C++
int ledV = 10, ledA = 9, ledG = 8;
int botao = 2;

void setup() {
  pinMode(ledV, OUTPUT);
  pinMode(ledA, OUTPUT);
  pinMode(ledG, OUTPUT);
  pinMode(botao, INPUT_PULLUP);
}

void loop() {

  if (!digitalRead(botao)) {
    // pedestre pediu passagem
    digitalWrite(ledG, LOW);
    digitalWrite(ledA, HIGH); delay(1000);
    digitalWrite(ledA, LOW);
    digitalWrite(ledV, HIGH); delay(4000);
    digitalWrite(ledV, LOW);
  }

  digitalWrite(ledG, HIGH);
}
```

* * *

📖 História Infantil – “Sinalzinho, o Amigo do Pedestre”
--------------------------------------------------------

Sinalzinho adorava ajudar crianças a atravessar a rua.  

Quando uma criança apertava o botão, ele dizia:

🔴 “Espere um pouquinho…”  

🟢 “Agora pode ir!”

Ensina **segurança no trânsito** de forma divertida.

* * * 

# ⭐ **PROJETO 10 – Tartaruga Luminosa (“TurTuga RGB”)**

**Faixa:** 6 a 9 anos  
**BNCC:** Cores, luz e sombra, CG3, CG2

* * *

🎒 Materiais
------------

*   Arduino Uno
    
*   LED RGB
    
*   LDR
    
*   Resistor 10k
    
*   Jumpers
    
*   Protoboard
    

* * *

🔌 Esquemático (ASCII)
----------------------

```
LDR → 5V  
LDR → A0  
A0 → resistor 10k → GND

LED RGB:
R → D3  
G → D5  
B → D6  
GND → GND
```

* * *

💻 Código Arduino
-----------------

```C++
int ldr = A0;
int r = 3, g = 5, b = 6;

void setup() {
  pinMode(r, OUTPUT);
  pinMode(g, OUTPUT);
  pinMode(b, OUTPUT);
}

void loop() {
  int luz = analogRead(ldr);

  if (luz < 200) {
    // escuro → azul
    analogWrite(r, 0); analogWrite(g, 0); analogWrite(b, 255);
  } 
  else if (luz < 500) {
    // meia-luz → verde
    analogWrite(r, 0); analogWrite(g, 255); analogWrite(b, 0);
  } 
  else {
    // claro → vermelho
    analogWrite(r, 255); analogWrite(g, 0); analogWrite(b, 0);
  }
  
  delay(200);
}
```

* * *

📖 História Infantil – “TurTuga RGB”
------------------------------------

TurTuga era uma tartaruga mágica que mudava de cor conforme a luz.  

Se estivesse escuro, ficava azul…  

Com pouca luz, ficava verde…  

E com sol forte, ficava vermelha!

As crianças brincam com **luz e sombra**, aprendendo sobre intensidade luminosa.

* * *

# 📘 **6. VERSÃO DO PROFESSOR**

Inclui:
*   Objetivo pedagógico
    
*   Tempo estimado
    
*   Materiais alternativos
    
*   Diagnóstico de aprendizagem
    
*   Sugestão de avaliação
    
*   Perguntas orientadoras
    
*   Extensões STEAM
    
_(Será expandida completamente após a landing page, se desejar.)_

* * *

# 📗 **7. VERSÃO DO ALUNO**

Inclui:
*   Explicações simplificadas
    
*   Tarefas passo a passo
    
*   Espaço para colar fotos
    
*   Missões divertidas
    
*   Linguagem acessível e lúdica
    

* * *

# 🙌 **8. Créditos**

Projeto criado por Claudecir Miranda com auxílio de IA para fins educacionais.
