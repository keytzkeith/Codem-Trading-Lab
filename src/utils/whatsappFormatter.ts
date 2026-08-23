import { Experiment } from '../types/trade';
import { calculateTradeStats } from './calculations';

export type WhatsAppTemplateId = 'standard_summary' | 'detailed_breakdown' | 'signal_idea' | 'weekly_digest';

export function getVerdictEmoji(verdict: string): string {
  switch (verdict) {
    case 'KEEP':
      return '🟢 KEEP';
    case 'KEEP_TESTING':
      return '🟡 KEEP TESTING';
    case 'DISCARD':
      return '🔴 DISCARD';
    case 'MODIFY_PARAMS':
      return '🔄 MODIFY PARAMETERS';
    default:
      return '⚪ ' + verdict;
  }
}

export function getAppBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    // If running on local or dev/pre cloud run, construct public URL
    if (host.includes('codemlab.online')) {
      return 'https://codemlab.online';
    }
    return window.location.origin;
  }
  return 'https://codemlab.online';
}

export function formatWhatsAppReport(
  experiment: Experiment,
  templateId: WhatsAppTemplateId = 'standard_summary',
  customNote: string = '',
  includeLink: boolean = true
): string {
  const stats = calculateTradeStats(experiment.trades);
  const verdictText = getVerdictEmoji(experiment.verdict);
  const netSign = stats.netR >= 0 ? '+' : '';
  const expSign = stats.expectancy >= 0 ? '+' : '';
  const baseUrl = getAppBaseUrl();
  const directLink = `${baseUrl}/?exp=${encodeURIComponent(experiment.id)}`;

  const dateStr = new Date(experiment.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  if (templateId === 'standard_summary') {
    return `🧪 *CODEM BACKTEST — ${experiment.id}*

*${experiment.pair}* | *${experiment.timeframe}* | *${experiment.session}*
━━━━━━━━━━━━━━━━━━━━━
📊 *Strategy:* ${experiment.setupModel}
📈 *Trades Tested:* ${stats.totalTrades}
🎯 *Win Rate:* ${stats.winRate}% (${stats.wins}W / ${stats.losses}L / ${stats.breakevens}BE)
⚖️ *Avg RR:* ${stats.avgRR}R
💰 *Net Result:* *${netSign}${stats.netR}R*
🎲 *Expectancy:* ${expSign}${stats.expectancy}R / trade
📉 *Max Loss Streak:* ${stats.maxConsecutiveLosses}
🛡️ *Max Drawdown:* -${stats.maxDrawdownR}R
━━━━━━━━━━━━━━━━━━━━━
💡 *Key Finding:*
${experiment.keyFinding || 'Systematic execution verified consistent risk/reward distribution.'}

${experiment.verdictNotes ? `📝 *Notes:* ${experiment.verdictNotes}\n` : ''}${customNote ? `💬 *Comment:* ${customNote}\n` : ''}
${verdictText}
━━━━━━━━━━━━━━━━━━━━━
📅 _Date: ${dateStr}_
${includeLink ? `\n📊 *Live Interactive Study & Trade Log:*\n${directLink}\n` : ''}
🚀 *CODEM TRADING LAB* — _Backtest • Document • Execute_`;
  }

  if (templateId === 'detailed_breakdown') {
    const recentSample = experiment.trades.slice(0, 5);
    const tradeLines = recentSample
      .map(
        (t, i) =>
          `  ${t.result === 'Win' ? '✅' : t.result === 'Loss' ? '❌' : '⚪'} #${t.tradeNumber || i + 1}: ${t.direction.toUpperCase()} @ ${t.session} → *${t.realizedRR > 0 ? '+' : ''}${t.realizedRR}R*`
      )
      .join('\n');

    return `🔬 *CODEM LAB DEEP-DIVE — ${experiment.id}*
*Asset:* ${experiment.pair} (${experiment.timeframe})
*Setup Model:* ${experiment.setupModel}
*Session:* ${experiment.session}

📐 *Statistical Profile:*
• Sample Size: *${stats.totalTrades} trades*
• Win Rate: *${stats.winRate}%*
• Profit Factor: *${stats.profitFactor}*
• Net R-Multiple: *${netSign}${stats.netR}R*
• Expectancy: *${expSign}${stats.expectancy}R*
• Avg Win: +${stats.avgWinRR}R | Avg Loss: -${stats.avgLossRR}R

📋 *Recent Trade Sample:*
${tradeLines}${experiment.trades.length > 5 ? `\n  _...and ${experiment.trades.length - 5} more documented trades_` : ''}

🧠 *Hypothesis & Research Finding:*
${experiment.keyFinding}

${verdictText}

${customNote ? `\n💬 *Lead Trader Note:* ${customNote}` : ''}
${includeLink ? `\n🔗 *Full Interactive Study:*\n${directLink}` : ''}
━━━━━━━━━━━━━━━━━━━━━
CODEM TRADING RESEARCH • ${dateStr}`;
  }

  if (templateId === 'signal_idea') {
    return `⚡ *CODEM TRADING — EXPERIMENT ALERT*

🏷️ *Setup ID:* ${experiment.id}
🎯 *Pair / Session:* ${experiment.pair} • ${experiment.session}
⏱️ *Timeframe:* ${experiment.timeframe}
📐 *Model:* ${experiment.setupModel}

📊 *Proven Backtest Edge:*
• Win Rate: ${stats.winRate}%
• Net Yield: ${netSign}${stats.netR}R
• R:R Profile: 1 : ${stats.avgRR}

💡 *Execution Rule:*
"${experiment.keyFinding}"

${verdictText}
${includeLink ? `\n🔗 *Verify Stats:* ${directLink}` : ''}
━━━━━━━━━━━━━━━━━━━━━
CODEM TRADING LAB`;
  }

  // Weekly Digest
  return `📋 *CODEM TRADING LAB — RESEARCH UPDATE*

*Experiment:* ${experiment.id} (${experiment.pair} ${experiment.timeframe})
*Verdict:* ${verdictText}
*Performance:* ${stats.winRate}% Win Rate | ${netSign}${stats.netR}R Net (${stats.totalTrades} Trades)

*Core Takeaway:*
${experiment.keyFinding}
${includeLink ? `\n🔗 *Interactive Report:* ${directLink}` : ''}

CODEM TRADING LAB`;
}

export function openWhatsAppShare(text: string, phoneOrGroup: string = '') {
  const encodedText = encodeURIComponent(text);
  let url = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (phoneOrGroup && /^\+?[0-9]{8,15}$/.test(phoneOrGroup.replace(/\D/g, ''))) {
    const cleanPhone = phoneOrGroup.replace(/\D/g, '');
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  
  // Try opening in new window / tab
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openWhatsAppWeb(text: string) {
  const encodedText = encodeURIComponent(text);
  window.open(`https://web.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
}
