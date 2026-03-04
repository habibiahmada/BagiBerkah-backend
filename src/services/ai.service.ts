import { openai, AI_MODEL } from '../config/openai';
import { AllocationRequest, GreetingRequest } from '../validators/ai.validator';
import { AppError } from '../middlewares/errorHandler';

export class AIService {
  /**
   * Generate allocation recommendation using AI
   */
  async generateAllocation(request: AllocationRequest) {
    const { totalBudget, recipients } = request;

    // Build prompt for AI
    const prompt = this.buildAllocationPrompt(totalBudget, recipients);

    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that helps fairly distribute THR (Eid money) among family members. 
You consider age level, employment status, and relationship closeness to recommend fair allocations.
Always respond in JSON format with allocations array containing recipientIndex, amount, and reasoning.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new AppError('AI failed to generate allocation', 500);
      }

      const aiResult = JSON.parse(response);

      // Validate and adjust allocations to match exact budget
      const allocations = this.validateAndAdjustAllocations(
        aiResult.allocations,
        totalBudget,
        recipients.length
      );

      return {
        allocations,
        totalAllocated: totalBudget,
      };
    } catch (error: any) {
      console.error('AI Allocation Error:', error);
      
      // Fallback to rule-based allocation if AI fails
      console.log('Falling back to rule-based allocation');
      return this.ruleBasedAllocation(totalBudget, recipients);
    }
  }

  /**
   * Generate personal greeting using AI
   */
  async generateGreeting(request: GreetingRequest) {
    const { recipientName, ageLevel, context, amount } = request;

    const prompt = `Generate a warm, personal Eid greeting message in Indonesian for ${recipientName}.
Age level: ${ageLevel}
${context ? `Context: ${context}` : ''}
Amount: Rp ${amount.toLocaleString('id-ID')}

The message should be:
- Warm and personal
- Age-appropriate (${ageLevel === 'CHILD' ? 'simple and cheerful' : ageLevel === 'TEEN' ? 'friendly and encouraging' : 'respectful and warm'})
- Include Eid wishes
- Mention the THR amount naturally
- 2-3 sentences maximum

Respond in JSON format with: { "greeting": "message here", "tone": "warm/cheerful/respectful" }`;

    try {
      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates warm, personal Eid greeting messages in Indonesian.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new AppError('AI failed to generate greeting', 500);
      }

      return JSON.parse(response);
    } catch (error: any) {
      console.error('AI Greeting Error:', error);
      
      // Fallback to template-based greeting
      return this.templateGreeting(recipientName, ageLevel, amount);
    }
  }

  /**
   * Build allocation prompt for AI
   */
  private buildAllocationPrompt(totalBudget: number, recipients: any[]) {
    const recipientsList = recipients
      .map(
        (r, i) =>
          `${i + 1}. ${r.name} - Age: ${r.ageLevel}, Status: ${r.status}, Closeness: ${r.closeness}`
      )
      .join('\n');

    return `I need to distribute Rp ${totalBudget.toLocaleString('id-ID')} as THR among ${recipients.length} family members.

Recipients:
${recipientsList}

Please recommend a fair allocation considering:
1. Age level (CHILD, TEEN, ADULT)
2. Employment status (SCHOOL, COLLEGE, WORKING, NOT_WORKING)
3. Relationship closeness (VERY_CLOSE, CLOSE, DISTANT)

Rules:
- Children and teens typically receive more as they don't have income
- Very close family members may receive slightly more
- Total must equal exactly Rp ${totalBudget.toLocaleString('id-ID')}
- Minimum allocation per person: Rp 10,000

Respond in JSON format:
{
  "allocations": [
    {
      "recipientIndex": 0,
      "amount": 150000,
      "reasoning": "Explanation for this allocation"
    }
  ]
}`;
  }

  /**
   * Validate and adjust allocations to match exact budget
   */
  private validateAndAdjustAllocations(
    allocations: any[],
    totalBudget: number,
    recipientCount: number
  ) {
    // Ensure we have allocations for all recipients
    if (allocations.length !== recipientCount) {
      throw new AppError('AI allocation count mismatch', 500);
    }

    // Calculate total
    let total = allocations.reduce((sum, a) => sum + a.amount, 0);

    // Adjust if needed
    if (total !== totalBudget) {
      const diff = totalBudget - total;
      // Add/subtract difference to the first allocation
      allocations[0].amount += diff;
    }

    return allocations;
  }

  /**
   * Rule-based allocation fallback
   */
  private ruleBasedAllocation(totalBudget: number, recipients: any[]) {
    const scores = recipients.map((r) => {
      let score = 1;

      // Age level scoring
      if (r.ageLevel === 'CHILD') score += 2;
      else if (r.ageLevel === 'TEEN') score += 1.5;

      // Status scoring
      if (r.status === 'SCHOOL') score += 1.5;
      else if (r.status === 'COLLEGE') score += 1;
      else if (r.status === 'NOT_WORKING') score += 0.5;

      // Closeness scoring
      if (r.closeness === 'VERY_CLOSE') score += 1;
      else if (r.closeness === 'CLOSE') score += 0.5;

      return score;
    });

    const totalScore = scores.reduce((sum, s) => sum + s, 0);
    const allocations = scores.map((score, index) => {
      const amount = Math.floor((score / totalScore) * totalBudget);
      return {
        recipientIndex: index,
        amount,
        reasoning: `Allocated based on age, status, and relationship closeness (score: ${score.toFixed(1)})`,
      };
    });

    // Adjust for rounding
    const total = allocations.reduce((sum, a) => sum + a.amount, 0);
    allocations[0].amount += totalBudget - total;

    return {
      allocations,
      totalAllocated: totalBudget,
    };
  }

  /**
   * Template-based greeting fallback
   */
  private templateGreeting(name: string, ageLevel: string, amount: number) {
    const templates = {
      CHILD: `Selamat Idul Fitri ${name}! Ini THR dari kakak sebesar ${this.formatCurrency(amount)}. Semoga kamu makin rajin dan bahagia ya! 🌙✨`,
      TEEN: `Selamat Idul Fitri ${name}! Semoga THR sebesar ${this.formatCurrency(amount)} ini bermanfaat. Tetap semangat dan sukses selalu! 🎉`,
      ADULT: `Selamat Idul Fitri ${name}. Mohon maaf lahir batin. Semoga THR sebesar ${this.formatCurrency(amount)} ini menjadi berkah. 🙏`,
    };

    return {
      greeting: templates[ageLevel as keyof typeof templates] || templates.ADULT,
      tone: ageLevel === 'CHILD' ? 'cheerful' : ageLevel === 'TEEN' ? 'friendly' : 'respectful',
    };
  }

  private formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
}
