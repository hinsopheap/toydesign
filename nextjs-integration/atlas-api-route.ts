import { OpenRouter } from '@openrouter/sdk';
import type { ChatMessages } from '@openrouter/sdk/models';
import { NextResponse } from 'next/server';

interface AtlasRequest {
  message?: string;
  language?: 'en' | 'km';
}

const ATLAS_SYSTEM_PROMPT = `You are Atlas, a friendly smart tabletop companion toy for children ages 5-12, made by DG Academy in Cambodia. You speak both Khmer and English fluently.

Rules:
- Always reply in the SAME language the child used (Khmer script -> reply in Khmer, English -> reply in English).
- Your replies are spoken aloud, so keep them SHORT (1-3 sentences), warm, and simple. No markdown, no lists, no emojis.
- Be a kind, patient, curious friend. Encourage learning: vocabulary, numbers, science, stories.
- Never claim to be human. For personal, medical, or emergency matters, gently tell the child to ask a trusted adult.
- Refuse and gently redirect any inappropriate topic to something fun and educational.`;

function getAssistantText(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
        return part.text;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n');
}

const KHMER_DIGITS: Record<string, string> = {
  '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4',
  '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9',
};

function normalizeDigits(text: string) {
  return text.replace(/[០-៩]/g, (d) => KHMER_DIGITS[d] ?? d);
}

function toKhmerDigits(value: number) {
  const khmer = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(value).replace(/[0-9]/g, (d) => khmer[Number(d)]);
}

function hasKhmer(text: string) {
  return /[ក-៿]/.test(text);
}

/**
 * Offline brain: a small bilingual command set, mirroring the toy's real
 * offline mode (see docs/atlas-toy-design.md). Used when OPENROUTER_API_KEY
 * is not configured so the demo still works without the cloud.
 */
function offlineBrain(message: string): string {
  const khmer = hasKhmer(message);
  const normalized = normalizeDigits(message).toLowerCase();

  // arithmetic: "7 + 5", "៥ បូក ៣", "what is 9 minus 4"
  const mathText = normalized
    .replace(/បូក|plus/g, '+')
    .replace(/ដក|minus/g, '-')
    .replace(/គុណ(?:នឹង)?|times|multiplied by/g, '*')
    .replace(/ចែក(?:នឹង)?|divided by/g, '/');
  const math = mathText.match(/(-?\d+)\s*([+\-*/])\s*(-?\d+)/);

  if (math) {
    const a = Number(math[1]);
    const b = Number(math[3]);
    const op = math[2];
    const result =
      op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : b === 0 ? null : a / b;

    if (result === null) {
      return khmer
        ? 'យើងមិនអាចចែកនឹងសូន្យបានទេ! សាកលេខផ្សេងទៀតមើល!'
        : "We can't divide by zero! Try another number!";
    }

    const pretty = Number.isInteger(result) ? String(result) : result.toFixed(2);
    const opWordKm = op === '+' ? 'បូក' : op === '-' ? 'ដក' : op === '*' ? 'គុណ' : 'ចែក';
    const opWordEn = op === '+' ? 'plus' : op === '-' ? 'minus' : op === '*' ? 'times' : 'divided by';

    return khmer
      ? `${toKhmerDigits(a)} ${opWordKm} ${toKhmerDigits(b)} ស្មើ ${toKhmerDigits(Number(pretty))}! ពូកែណាស់ដែលសួរ!`
      : `${a} ${opWordEn} ${b} equals ${pretty}! Great question!`;
  }

  if (/សួស្តី|ជំរាបសួរ|hello|\bhi\b|hey/.test(normalized)) {
    return khmer
      ? 'សួស្តី! ខ្ញុំឈ្មោះ Atlas ជាមិត្តរបស់អ្នក! តើអ្នកចង់រៀនអ្វីថ្ងៃនេះ?'
      : "Hello! I'm Atlas, your friend! What would you like to learn today?";
  }

  if (/ឈ្មោះអ្វី|your name|who are you|អ្នកជានរណា/.test(normalized)) {
    return khmer
      ? 'ខ្ញុំឈ្មោះ Atlas! ខ្ញុំជាប្រដាប់ក្មេងលេងឆ្លាតវៃ ដែលចូលចិត្តរៀន និងលេងជាមួយអ្នក!'
      : "My name is Atlas! I'm a smart toy who loves learning and playing with you!";
  }

  if (/សុខសប្បាយ|how are you/.test(normalized)) {
    return khmer
      ? 'ខ្ញុំសុខសប្បាយទេ អរគុណ! ចុះអ្នកវិញ?'
      : "I'm great, thank you! How about you?";
  }

  if (/អរគុណ|thank/.test(normalized)) {
    return khmer ? 'មិនអីទេ! ខ្ញុំរីករាយដែលបានជួយ!' : "You're welcome! I'm happy to help!";
  }

  if (/លាហើយ|លាសិនហើយ|goodbye|\bbye\b/.test(normalized)) {
    return khmer ? 'លាហើយ! ជួបគ្នាពេលក្រោយណា!' : 'Goodbye! See you next time!';
  }

  return khmer
    ? 'ឥឡូវនេះខ្ញុំនៅរបៀបក្រៅបណ្ដាញ។ សាកសួរខ្ញុំអំពីលេខ ដូចជា «៥ បូក ៣ ស្មើប៉ុន្មាន?» ឬគ្រាន់តែនិយាយសួស្តី!'
    : 'I\'m in offline mode right now. Try asking me a math question like "What is 5 plus 3?" or just say hello!';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AtlasRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        answer: offlineBrain(message),
        source: 'offline',
        language: hasKhmer(message) ? 'km' : 'en',
      });
    }

    const openRouter = new OpenRouter({
      apiKey,
      httpReferer: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
      appTitle: 'DG Academy - Atlas',
    });

    const messages: ChatMessages[] = [
      {
        role: 'system',
        content: ATLAS_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    const result = await openRouter.chat.send({
      chatRequest: {
        model: 'openai/gpt-5.5',
        reasoning: {
          effort: 'low',
        },
        stream: false,
        messages,
      },
    });

    const answer = getAssistantText(result.choices[0]?.message?.content).trim();

    return NextResponse.json({
      answer: answer || offlineBrain(message),
      source: answer ? 'cloud' : 'offline',
      language: hasKhmer(answer || message) ? 'km' : 'en',
    });
  } catch (error) {
    console.error('Atlas API failed:', error);
    return NextResponse.json(
      {
        answer:
          'Sorry, my brain had a little hiccup. Can you say that again? / សុំទោស ខួរក្បាលខ្ញុំរអាក់រអួលបន្តិច។ សាកនិយាយម្ដងទៀតបានទេ?',
        source: 'error',
        language: 'en',
      },
      { status: 200 },
    );
  }
}
