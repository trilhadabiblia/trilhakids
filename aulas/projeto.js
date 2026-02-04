import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Award, Target, Calendar, Package, DollarSign, CheckCircle } from 'lucide-react';

const TrilhoKidsApresentacao = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    // Slide 1 - Capa
    {
      title: "TrilhoKids 2026",
      subtitle: "Jornada de Heróis da Fé",
      icon: <Award className="w-16 h-16 text-yellow-500" />,
      content: (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
            <h3 className="text-3xl font-bold mb-2">Ministério Infantil Kids</h3>
            <p className="text-xl">Igreja Batista da Paz</p>
          </div>
          <div className="text-lg text-gray-700">
            <p className="font-semibold">Turma: 6 a 8 anos</p>
            <p className="mt-2">Sistema Gamificado de Ensino Bíblico</p>
          </div>
        </div>
      )
    },
    
    // Slide 2 - Sumário Executivo
    {
      title: "Sumário Executivo",
      icon: <Target className="w-12 h-12 text-blue-600" />,
      content: (
        <div className="space-y-4 text-left">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-2 text-blue-800">O Projeto</h4>
            <p className="text-gray-700">Sistema integrado de ensino bíblico gamificado para crianças de 6 a 8 anos, cobrindo todos os 66 livros da Bíblia ao longo de 2026.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-bold text-green-800 mb-2">Objetivo Principal</h5>
              <p className="text-sm text-gray-700">Tornar o aprendizado bíblico envolvente, mensurável e transformador através de metodologia gamificada</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-bold text-purple-800 mb-2">Diferenciais</h5>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                <li>Sistema de pontuação e recompensas</li>
                <li>Registro digital e analógico</li>
                <li>Material já produzido (1º trim.)</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <p className="text-sm font-semibold text-gray-800">✅ Apostila do Professor e Livro do Aluno do 1º Trimestre já finalizados</p>
          </div>
        </div>
      )
    },
    
    // Slide 3 - Visão Pedagógica
    {
      title: "Visão Pedagógica e Espiritual",
      icon: <BookOpen className="w-12 h-12 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-3 text-purple-800">Fundamentos do TrilhoKids</h4>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded shadow-sm">
                <h5 className="font-semibold text-purple-700 mb-1">📖 Cobertura Completa</h5>
                <p className="text-sm text-gray-700">Todos os 66 livros da Bíblia em formato adequado para crianças de 6-8 anos</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <h5 className="font-semibold text-blue-700 mb-1">🎮 Aprendizado Gamificado</h5>
                <p className="text-sm text-gray-700">Pontos, selos, badges e desafios que motivam e engajam as crianças</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <h5 className="font-semibold text-green-700 mb-1">🎯 Memorização Ativa</h5>
                <p className="text-sm text-gray-700">Versículos-chave com sistema de recompensas por decoração</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <h5 className="font-semibold text-yellow-700 mb-1">📊 Progresso Mensurável</h5>
                <p className="text-sm text-gray-700">Acompanhamento individual e coletivo do desenvolvimento espiritual</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    
    // Slide 4 - Sistema Gamificado
    {
      title: "Sistema Gamificado Detalhado",
      icon: <Award className="w-12 h-12 text-yellow-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
            <h4 className="font-bold text-lg mb-3 text-yellow-800">⭐ Pontuação Semanal</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white p-2 rounded">+10 pts - Presença</div>
              <div className="bg-white p-2 rounded">+5 pts - Participação</div>
              <div className="bg-white p-2 rounded">+10 pts - Quiz realizado</div>
              <div className="bg-white p-2 rounded">+10 pts - 70%+ acertos</div>
              <div className="bg-white p-2 rounded">+5 pts - Trouxe Bíblia</div>
              <div className="bg-white p-2 rounded">+10 pts - Versículo decorado</div>
              <div className="bg-white p-2 rounded">+5 pts - Ajudou colega</div>
              <div className="bg-white p-2 rounded">+20 pts - Atividade especial</div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
            <h4 className="font-bold text-lg mb-3 text-purple-800">🏆 Badges Mensais</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded flex justify-between">
                <span>📘 Explorador do Mês</span>
                <span className="font-bold text-purple-600">+30 pts</span>
              </div>
              <div className="bg-white p-2 rounded flex justify-between">
                <span>🧠 Leitor Consistente</span>
                <span className="font-bold text-purple-600">+20 pts</span>
              </div>
              <div className="bg-white p-2 rounded flex justify-between">
                <span>💪 Coragem</span>
                <span className="font-bold text-purple-600">+10 pts</span>
              </div>
              <div className="bg-white p-2 rounded flex justify-between">
                <span>❤️ Destaque da Bondade</span>
                <span className="font-bold text-purple-600">+10 pts</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
            <p className="text-sm font-semibold text-gray-800">🎯 Média esperada: 50-60 pontos por aluno/semana</p>
          </div>
        </div>
      )
    },
    
    // Slide 5 - Sistema de Registro
    {
      title: "Sistema de Registro - Duplo",
      icon: <CheckCircle className="w-12 h-12 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
            <h4 className="font-bold text-lg mb-3 text-orange-800">📋 A) Sistema Analógico</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded shadow">
                <h5 className="font-semibold text-orange-700 mb-1">1. Cartaz Geral da Turma</h5>
                <p className="text-gray-600">Painel A2 visível com progresso de todos os alunos (pontos, selos, presenças)</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h5 className="font-semibold text-orange-700 mb-1">2. Ficha Individual (A5)</h5>
                <p className="text-gray-600">Cartão de cada aluno com pontos, selos conquistados e versículos</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <h5 className="font-semibold text-orange-700 mb-1">3. Passaporte TrilhoKids</h5>
                <p className="text-gray-600">Crachá plastificado que o aluno traz todas as semanas para marcar presença</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
            <h4 className="font-bold text-lg mb-3 text-blue-800">💻 B) Sistema Digital (Google Sheets)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white p-2 rounded">📊 Aba: Alunos</div>
              <div className="bg-white p-2 rounded">📈 Aba: Progresso Semanal</div>
              <div className="bg-white p-2 rounded">🏆 Aba: Ranking</div>
              <div className="bg-white p-2 rounded">✅ Aba: Presenças</div>
              <div className="bg-white p-2 rounded col-span-2">📉 Aba: Estatísticas e Relatórios</div>
            </div>
            <p className="text-xs text-gray-600 mt-2 italic">Planilha compartilhada com coordenação para acompanhamento em tempo real</p>
          </div>
        </div>
      )
    },
    
    // Slide 6 - Materiais
    {
      title: "Materiais e Recursos",
      icon: <Package className="w-12 h-12 text-red-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
            <h4 className="font-bold text-lg mb-3 text-red-800">📦 Kit Básico do Professor (todas as aulas)</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2 rounded text-center">Bíblia</div>
              <div className="bg-white p-2 rounded text-center">Tablet/Notebook</div>
              <div className="bg-white p-2 rounded text-center">Caixa de som</div>
              <div className="bg-white p-2 rounded text-center">Lista de alunos</div>
              <div className="bg-white p-2 rounded text-center">Selos impressos</div>
              <div className="bg-white p-2 rounded text-center">Material de arte</div>
              <div className="bg-white p-2 rounded text-center">Quadro branco</div>
              <div className="bg-white p-2 rounded text-center">Crachás</div>
              <div className="bg-white p-2 rounded text-center">Planilha registro</div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
            <h4 className="font-bold text-lg mb-3 text-green-800">🎒 Kit do Explorador 2026 (por aluno)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white p-2 rounded">✅ Passaporte TrilhoKids</div>
              <div className="bg-white p-2 rounded">✅ Ficha Individual</div>
              <div className="bg-white p-2 rounded">✅ Envelope "Conquistas"</div>
              <div className="bg-white p-2 rounded">✅ Adesivos iniciais (3)</div>
              <div className="bg-white p-2 rounded">✅ Marca-páginas</div>
              <div className="bg-white p-2 rounded">✅ Cartão QR Code</div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-bold text-base mb-2 text-purple-800">📚 Material Didático (trimestral)</h4>
            <div className="flex gap-4 text-sm">
              <div className="bg-white p-3 rounded flex-1 text-center">
                <p className="font-semibold">Apostila Professor</p>
                <p className="text-xs text-gray-600">Planos de aula detalhados</p>
              </div>
              <div className="bg-white p-3 rounded flex-1 text-center">
                <p className="font-semibold">Livro do Aluno</p>
                <p className="text-xs text-gray-600">Atividades e quizzes</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    
    // Slide 7 - Cronograma
    {
      title: "Cronograma de Implementação",
      icon: <Calendar className="w-12 h-12 text-indigo-600" />,
      content: (
        <div className="space-y-3">
          <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
            <h4 className="font-bold text-indigo-800 mb-3">📅 Timeline 2026</h4>
            
            <div className="space-y-2">
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">1º Trimestre</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✅ Material Pronto</span>
                </div>
                <p className="text-xs text-gray-600">Janeiro - Março | Profetas Menores (Oséias a Malaquias + 400 anos)</p>
                <p className="text-xs text-green-700 font-semibold mt-1">11 aulas já planejadas</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">2º Trimestre</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">📝 A Produzir</span>
                </div>
                <p className="text-xs text-gray-600">Abril - Junho | Sugestão: Novo Testamento (Evangelhos)</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">3º Trimestre</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">📝 A Produzir</span>
                </div>
                <p className="text-xs text-gray-600">Julho - Setembro | Sugestão: Pentateuco (Gênesis a Deuteronômio)</p>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">4º Trimestre</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">📝 A Produzir</span>
                </div>
                <p className="text-xs text-gray-600">Outubro - Dezembro | Sugestão: Atos e Cartas</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-semibold text-sm text-blue-800 mb-2">🎯 Estrutura Anual</h5>
            <div className="text-xs text-gray-700 space-y-1">
              <p>• <strong>48 semanas letivas</strong> (excluindo feriados e férias)</p>
              <p>• <strong>12 semanas por trimestre</strong></p>
              <p>• <strong>Cobertura completa da Bíblia</strong> em linguagem adequada</p>
            </div>
          </div>
        </div>
      )
    },
    
    // Slide 8 - Benefícios
    {
      title: "Benefícios Esperados",
      icon: <Target className="w-12 h-12 text-teal-600" />,
      content: (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-teal-50 to-green-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-3 text-teal-800">🎯 Para as Crianças</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white p-3 rounded shadow">
                <p className="font-semibold text-teal-700 mb-1">📖 Conhecimento Bíblico</p>
                <p className="text-xs text-gray-600">Exposição completa aos 66 livros da Bíblia</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <p className="font-semibold text-green-700 mb-1">🎮 Engajamento</p>
                <p className="text-xs text-gray-600">Aprendizado lúdico e motivador</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <p className="font-semibold text-blue-700 mb-1">🧠 Memorização</p>
                <p className="text-xs text-gray-600">Versículos guardados no coração</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <p className="font-semibold text-purple-700 mb-1">💪 Desenvolvimento</p>
                <p className="text-xs text-gray-600">Crescimento espiritual mensurável</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-3 text-blue-800">👨‍🏫 Para os Professores</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-gray-700">Material estruturado e pronto para uso</span>
              </div>
              <div className="bg-white p-2 rounded flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-gray-700">Sistema de acompanhamento facilitado</span>
              </div>
              <div className="bg-white p-2 rounded flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-gray-700">Feedback visual do progresso da turma</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg">
            <h4 className="font-bold text-lg mb-3 text-orange-800">⛪ Para a Igreja</h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-gray-700">Metodologia replicável para outras turmas</span>
              </div>
              <div className="bg-white p-2 rounded flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-gray-700">Excelência no ministério infantil</span>
              </div>
              <div className="bg-white p-2 rounded flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-gray-700">Relatórios de impacto para liderança</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    
    // Slide 9 - Próximos Passos
    {
      title: "Próximos Passos",
      icon: <CheckCircle className="w-12 h-12 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-400">
            <h4 className="font-bold text-lg mb-3 text-green-800">✅ Após Aprovação do Projeto</h4>
            
            <div className="space-y-3">
              <div className="bg-white p-3 rounded shadow-sm border-l-4 border-green-500">
                <h5 className="font-semibold text-sm mb-1">1️⃣ Produção de Materiais (1º Trimestre)</h5>
                <ul className="text-xs text-gray-700 space-y-1 ml-4">
                  <li>• Impressão de apostilas do professor</li>
                  <li>• Impressão de livros do aluno</li>
                  <li>• Confecção do cartaz geral (A2)</li>
                  <li>• Produção dos Kits do Explorador</li>
                  <li>• Impressão de selos e badges</li>
                  <li>• Criação da planilha digital</li>
                </ul>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-500">
                <h5 className="font-semibold text-sm mb-1">2️⃣ Capacitação</h5>
                <ul className="text-xs text-gray-700 space-y-1 ml-4">
                  <li>• Treinamento com professores da turma</li>
                  <li>• Apresentação do sistema gamificado</li>
                  <li>• Tutorial da planilha digital</li>
                </ul>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm border-l-4 border-purple-500">
                <h5 className="font-semibold text-sm mb-1">3️⃣ Lançamento (Janeiro 2026)</h5>
                <ul className="text-xs text-gray-700 space-y-1 ml-4">
                  <li>• Aula inaugural com entrega dos kits</li>
                  <li>• Apresentação do sistema para pais</li>
                  <li>• Início do acompanhamento semanal</li>
                </ul>
              </div>
              
              <div className="bg-white p-3 rounded shadow-sm border-l-4 border-yellow-500">
                <h5 className="font-semibold text-sm mb-1">4️⃣ Desenvolvimento Contínuo</h5>
                <ul className="text-xs text-gray-700 space-y-1 ml-4">
                  <li>• Produção dos materiais do 2º trimestre (Fev-Mar)</li>
                  <li>• Avaliação e ajustes do sistema</li>
                  <li>• Planejamento dos demais trimestres</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-blue-800">📧 Contato para dúvidas e aprovação:</p>
            <p className="text-xs text-gray-600 mt-1">Coordenação do Ministério Infantil Kids</p>
          </div>
        </div>
      )
    },
    
    // Slide 10 - Investimento
    {
      title: "Investimento Necessário",
      icon: <DollarSign className="w-12 h-12 text-green-600" />,
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
            <h4 className="font-bold text-lg mb-3 text-yellow-800">💰 Estimativa de Custos (1º Trimestre)</h4>
            
            <div className="space-y-2 text-sm">
              <div className="bg-white p-3 rounded shadow flex justify-between items-center">
                <span className="text-gray-700">Impressão Apostilas Professor (colorido)</span>
                <span className="font-semibold text-gray-800">R$ ___</span>
              </div>
              
              <div className="bg-white p-3 rounded shadow flex justify-between items-center">
                <span className="text-gray-700">Impressão Livros Aluno (colorido) x __ alunos</span>
                <span className="font-semibold text-gray-800">R$ ___</span>
              </div>
              
              <div className="bg-white p-3 rounded shadow flex justify-between items-center">
                <span className="text-gray-700">Kits do Explorador (crachás, envelopes, adesivos)</span>
                <span className="font-semibold text-gray-800">R$ ___</span>
              </div>
              
              <div className="bg-white p-3 rounded shadow flex justify-between items-center">
                <span className="text-gray-700">Cartaz A2 + Material de apoio</span>
                <span className="font-semibold text-gray-800">R$ ___</span>
              </div>
              
              <div className="bg-white p-3 rounded shadow flex justify-between items-center">
                <span className="text-gray-700">Materiais específicos das aulas (artesanato)</span>
                <span className="font-semibold text-gray-800">R$ ___</span>
              </div>
              
              <div className="bg-green-100 p-3 rounded shadow border-2 border-green-400 flex justify-between items-center mt-4">
                <span className="font-bold text-gray-800">TOTAL ESTIMADO</span>
                <span className="font-bold text-xl text-green-700">R$ ___</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Observação:</strong> Os valores podem variar conforme fornecedores e quantidade de alunos. 
              O sistema digital (planilha Google Sheets) não tem custo adicional.
            </p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <h5 className="font-semibold text-sm text-purple-800 mb-2">💡 Opção de Custeio</h5>
            <p className="text-xs text-gray-700">
              Possibilidade de solicitar contribuição opcional dos pais para o Kit do Explorador, 
              reduzindo o investimento da igreja.
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {slides[currentSlide].icon}
              <h1 className="text-3xl font-bold">{slides[currentSlide].title}</h1>
            </div>
            <div className="text-sm bg-white/20 px-4 py-2 rounded-full">
              Slide {currentSlide + 1} / {slides.length}
            </div>
          </div>
          {slides[currentSlide].subtitle && (
            <p className="text-xl mt-2 text-blue-100">{slides[currentSlide].subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-8 min-h-[500px]">
          {slides[currentSlide].content}
        </div>

        {/* Navigation */}
        <div className="bg-gray-50 p-6 flex justify-between items-center border-t">
          <button
            onClick={prevSlide}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition ${
                  index === currentSlide ? 'bg-blue-600 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentSlide === slides.length - 1}
          >
            Próximo
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 text-center">
          <p className="text-sm">
            TrilhoKids 2026 - Ministério Infantil Kids | Igreja Batista da Paz
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrilhoKidsApresentacao;