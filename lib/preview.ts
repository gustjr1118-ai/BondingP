import type { CompletedResult, WorkMode } from "./contracts";
import { buildFinalPrompt } from "./prompt";

// Synthetic content for development-only visual review; never calls the AI.
const examples = {
  general: {
    ko: [
      "업무 보고서 작성 전문가로서 팀장이 진행 상황과 지원 필요 사항을 빠르게 파악할 수 있는 주간 보고서를 작성해줘.",
      "독자는 팀장이며, 입력 자료는 이번 주 업무 메모다.\n일정, 담당자, 실적이 제공되지 않았다면 ‘확인 필요’로 표시하고 임의로 만들지 마.",
      "완료 업무, 진행 중 업무, 이슈, 다음 주 계획으로 분류해줘.\n의사결정이 필요한 항목을 먼저 제시하고 중복된 내용은 합쳐줘.",
      "다음은 형식 예시이며 실제 실적이 아니다.\n[업무명] | [진행 상태] | [성과 또는 이슈] | [다음 조치]",
      "핵심 요약 3줄과 업무 현황 표로 작성해줘.\n표에는 업무명, 담당자, 상태, 이슈, 다음 조치, 기한을 포함해줘.",
      "간결하고 객관적인 보고 어조를 사용해줘.\n입력된 모든 업무를 반영했는지 확인하고, 미확인 정보 목록까지 제시한 뒤 마무리해줘.",
    ],
    en: [
      "Act as a business reporting specialist. Write a weekly report that helps a team lead identify progress and support needs quickly.",
      "The audience is the team lead; the input is this week's work notes.\nMark missing dates, owners and outcomes as ‘To be confirmed’; do not invent them.",
      "Group items into completed work, work in progress, issues and next week's plan.\nPrioritize decisions needed and consolidate duplicate items.",
      "The following is a format example, not actual performance data.\n[Task] | [Status] | [Outcome or issue] | [Next action]",
      "Provide a three-line executive summary and a work-status table.\nInclude task, owner, status, issue, next action and deadline columns.",
      "Use a concise, objective reporting tone.\nVerify coverage of all supplied tasks and finish with a list of information requiring confirmation.",
    ],
  },
  bonding: {
    ko: [
      "Flexible OLED Display Module의 OLB 전문가로서 Open 불량의 원인 후보와 검증 계획을 제시해줘.\n확인된 원인과 추가 검증이 필요한 가설을 구분해줘.",
      "분석 대상은 Flexible Panel–COF 연결 OLB 공정이다.\n불량 발생 위치, 발생 시점, 로트별 분포와 디자인 변경 이력을 입력 자료에서 정리해줘.",
      "ACF 사양, 전극 피치·겹침 면적, 얼라인먼트 오차, 본딩 헤드 평탄도, 온도·압력·시간 이력을 확인해줘.\n제공되지 않은 값은 ‘미확인’으로 표시하고 단위와 측정 방법을 함께 정리해줘.",
      "Root Cause → Mechanism → Solution 순서로 분석해줘.\nACF, 얼라인먼트, 압착 조건별 원인 가설을 나누고 각 가설을 지지하거나 반박할 측정 근거를 명시해줘.",
      "원인 가설별 확인 실험, 측정 항목, 개선 후보, 합격 기준을 제시해줘.\n검증되지 않은 온도·압력 조건을 확정 레시피로 제시하지 말고 재료·설비 사양 범위를 확인해줘.",
      "입력·미확인 조건 표, 원인–메커니즘–증거–개선안 표, 검증 계획 체크리스트로 작성해줘.\n측정값에는 단위를 붙이고 결과가 없으면 공란 대신 ‘측정 필요’라고 표시해줘.",
      "논문·학술 자료·적용 가능한 산업 표준의 근거를 사용하고 확인하지 못한 출처는 만들지 마.\n근거가 부족한 실무 조언 앞에는 [개인적인 의견]을 붙여줘.\n간결한 분석 어조로 작성하고 가설별 검증 방법과 미해결 항목을 제시하면 마무리해줘.",
    ],
    en: [
      "Act as an OLB specialist for Flexible OLED Display Modules. Identify candidate causes of Open defects and a validation plan.\nSeparate confirmed causes from hypotheses requiring further evidence.",
      "The scope is OLB connecting the Flexible Panel to COF.\nSummarize defect location, timing, lot distribution and design-change history from the supplied inputs.",
      "Review ACF specifications, electrode pitch and overlap area, alignment error, bonding-head planarity, and temperature, pressure and time histories.\nMark missing values as ‘Unknown’ and specify units and measurement methods.",
      "Organize the analysis as Root Cause → Mechanism → Solution.\nGroup hypotheses by ACF, alignment and bonding conditions, and identify measurements that support or refute each hypothesis.",
      "For each hypothesis, specify confirmation experiments, measurements, candidate improvements and acceptance criteria.\nDo not present unvalidated temperatures or pressures as established recipes; check material and equipment specifications.",
      "Provide an input/unknown-conditions table, a cause–mechanism–evidence–solution table and a validation checklist.\nAttach units to measurements and label absent results ‘Measurement required’.",
      "Use evidence from papers, academic sources and applicable industry standards; never fabricate unverified references.\nPrefix unsupported practical advice with [Personal opinion].\nUse a concise analytical tone and finish after providing validation methods and unresolved items for each hypothesis.",
    ],
  },
};

export function previewResult(mode: WorkMode): CompletedResult {
  const sample = examples[mode];
  return { status: "completed", mode,
    ko: { sections: sample.ko, finalPrompt: buildFinalPrompt(sample.ko, mode, "ko") },
    en: { sections: sample.en, finalPrompt: buildFinalPrompt(sample.en, mode, "en") },
  };
}
