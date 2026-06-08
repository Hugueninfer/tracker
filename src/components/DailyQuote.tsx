import { Quote } from 'lucide-react'

// Frases motivadoras em pt-BR (fonte local — sem API externa, sem CORS, offline).
// Rotação diária determinística: mesma frase o dia inteiro, muda a cada dia.
const QUOTES: { text: string; author: string }[] = [
  { text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
  { text: 'Não conte os dias, faça os dias contarem.', author: 'Muhammad Ali' },
  { text: 'A disciplina é a ponte entre metas e realizações.', author: 'Jim Rohn' },
  { text: 'Comece onde você está. Use o que você tem. Faça o que você pode.', author: 'Arthur Ashe' },
  { text: 'A jornada de mil quilômetros começa com um único passo.', author: 'Lao Tzu' },
  { text: 'Pequenos hábitos, grandes resultados.', author: 'James Clear' },
  { text: 'Você não precisa ser grande para começar, mas precisa começar para ser grande.', author: 'Zig Ziglar' },
  { text: 'A persistência realiza o impossível.', author: 'Provérbio chinês' },
  { text: 'Faça hoje o que os outros não querem, para ter amanhã o que os outros não terão.', author: 'Anônimo' },
  { text: 'O que você faz todos os dias importa mais do que o que você faz de vez em quando.', author: 'Gretchen Rubin' },
  { text: 'A motivação te faz começar. O hábito te faz continuar.', author: 'Jim Ryun' },
  { text: 'Cada dia é uma nova chance de mudar sua vida.', author: 'Anônimo' },
  { text: 'O segredo de progredir é começar.', author: 'Mark Twain' },
  { text: 'Não espere por oportunidades, crie-as.', author: 'George Bernard Shaw' },
  { text: 'A constância vence o talento quando o talento não é constante.', author: 'Anônimo' },
  { text: 'Foco no progresso, não na perfeição.', author: 'Anônimo' },
  { text: 'Grandes coisas nunca vêm de zonas de conforto.', author: 'Anônimo' },
  { text: 'A melhor hora para plantar uma árvore foi há 20 anos. A segunda melhor é agora.', author: 'Provérbio chinês' },
  { text: 'Energia e persistência conquistam todas as coisas.', author: 'Benjamin Franklin' },
  { text: 'Você é o que você faz repetidamente.', author: 'Aristóteles' },
  { text: 'Sonhe grande e ouse falhar.', author: 'Norman Vaughan' },
  { text: 'A diferença entre o possível e o impossível está na determinação.', author: 'Tommy Lasorda' },
  { text: 'Faça uma coisa todos os dias que te assuste um pouco.', author: 'Eleanor Roosevelt' },
  { text: 'O fracasso é apenas a oportunidade de recomeçar com mais inteligência.', author: 'Henry Ford' },
  { text: 'Quem quer fazer algo encontra um meio; quem não quer, encontra uma desculpa.', author: 'Provérbio árabe' },
  { text: 'A vida recompensa a ação, não a intenção.', author: 'Anônimo' },
  { text: 'Acredite que você consegue e já estará no meio do caminho.', author: 'Theodore Roosevelt' },
  { text: 'O hábito é uma corda; tecemos um fio dele todos os dias.', author: 'Horace Mann' },
  { text: 'Não é sobre ter tempo, é sobre fazer tempo.', author: 'Anônimo' },
  { text: 'O progresso, e não a perfeição, é o que devemos buscar.', author: 'Anônimo' },
  { text: 'Disciplina é escolher entre o que você quer agora e o que você quer mais.', author: 'Abraham Lincoln' },
  { text: 'Cada pequeno passo conta. Continue caminhando.', author: 'Anônimo' },
  { text: 'A qualidade não é um ato, é um hábito.', author: 'Aristóteles' },
  { text: 'Transforme seus "não posso" em "ainda não consegui".', author: 'Anônimo' },
  { text: 'O melhor projeto em que você pode trabalhar é você mesmo.', author: 'Anônimo' },
  { text: 'Vença a preguiça com pequenas vitórias diárias.', author: 'Anônimo' },
  { text: 'A consistência é mais importante que a intensidade.', author: 'Anônimo' },
  { text: 'Faça acontecer. Ninguém vai fazer por você.', author: 'Anônimo' },
  { text: 'Sua única limitação é aquela que você impõe em sua mente.', author: 'Napoleon Hill' },
  { text: 'Trabalhe duro em silêncio e deixe o sucesso fazer barulho.', author: 'Frank Ocean' },
  { text: 'Um pouco de progresso a cada dia soma grandes resultados.', author: 'Anônimo' },
  { text: 'Não pare quando estiver cansado. Pare quando terminar.', author: 'Anônimo' },
  { text: 'O hoje bem vivido faz de cada ontem um sonho de felicidade.', author: 'Provérbio sânscrito' },
  { text: 'Coragem não é a ausência de medo, mas a decisão de seguir em frente.', author: 'Anônimo' },
  { text: 'Plante hábitos bons e colha uma vida melhor.', author: 'Anônimo' },
  { text: 'A ação é a chave fundamental para todo sucesso.', author: 'Pablo Picasso' },
  { text: 'Comece pequeno, mas comece.', author: 'Anônimo' },
  { text: 'O futuro depende do que você faz hoje.', author: 'Mahatma Gandhi' },
  { text: 'Seja a melhor versão de si mesmo, um dia de cada vez.', author: 'Anônimo' },
  { text: 'Persista. O começo é sempre o mais difícil.', author: 'Anônimo' },
]

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86400000)
}

export function DailyQuote() {
  const q = QUOTES[dayOfYear(new Date()) % QUOTES.length]
  return (
    <div>
      <div className="flex items-center gap-2 text-meta text-muted mb-3">
        <Quote size={16} className="text-accent" />
        <span className="font-semibold">Frase do dia</span>
      </div>
      <p className="text-lg font-semibold leading-snug">{q.text}</p>
      <p className="text-meta text-muted mt-3">— {q.author}</p>
    </div>
  )
}
