// ─── Shared AI Image Prompt Builder ───────────────────────────────
// Ensures all generated images are photorealistic with zero text.

export const NO_TEXT = 'CRITICAL REQUIREMENT: The image must contain absolutely NO text whatsoever — no letters, no words, no numbers, no Arabic or English writing, no logos, no watermarks, no labels, no signs, no calligraphy, no typography, no decorative text elements of any kind. The image must be purely photographic with zero written characters of any language.';

const TYPE_STYLES = {
  product: 'professional commercial product photography, studio lighting, clean minimal background, centered composition, product clearly visible and prominent',
  slide: 'cinematic wide panoramic banner, luxury commercial photography, atmospheric depth, wide 16:9 horizontal composition, elegant and immersive',
  banner: 'professional promotional banner background, wide horizontal composition, luxury commercial aesthetic, clean spacious area suitable for text overlay',
  offer: 'luxury promotional photography, premium commercial aesthetic, vibrant elegant atmosphere, eye-catching hero composition',
  bundle: 'professional product bundle photography, luxury gift presentation, elegant arrangement of multiple items, premium composition',
  category: 'clean elegant category representative photography, minimalist composition, clear subject focus, professional studio lighting',
  logo: 'clean minimalist logo design, white background, professional brand identity, simple and recognizable, vector-style flat design',
  gallery: 'artistic lifestyle photography, elegant composition, professional quality, visually appealing, natural lighting',
};

export function buildImagePrompt(description, context = {}) {
  const { type = 'product', title, subtitle } = context;
  const style = TYPE_STYLES[type] || TYPE_STYLES.product;
  const desc = description?.trim() || subtitle?.trim() || title?.trim() || 'luxury commercial product';

  return `Ultra-realistic photorealistic image: ${desc}. ${style}, natural realistic lighting, 4K ultra high detail, sharp focus, true-to-life accurate colors and proportions. ${NO_TEXT}`;
}

export function suggestDescription(context = {}) {
  const { type, title, subtitle } = context;
  const name = title || 'المنتج';

  const suggestions = {
    product: `صورة احترافية لـ ${name} على خلفية بيضاء نظيفة مع إضاءة استوديو طبيعية تبرز تفاصيل المنتج بوضوح من جميع الزوايا`,
    slide: `مشهد بانورامي فاخر يعبر عن ${name} بأجواء راقية وإضاءة سينمائية دافئة وخلفية واسعة جذابة`,
    banner: `خلفية إعلانية أنيقة لـ ${name} بتصميم فاخر ومساحات فارغة مناسبة لإضافة نص لاحقاً مع إضاءة احترافية`,
    offer: `تصوير فاخر ومثير لعرض ${name} بألوان جذابة وأجواء راقية محفزة على الشراء مع تفاصيل دقيقة`,
    bundle: `عرض باقة ${name} بشكل احترافي مع ترتيب أنيق للمنتجات وتغليف فاخر وأجواء هدايا راقية`,
    category: `صورة تمثيلية أنيقة لـ ${name} بتكوين بسيط ونظيف يبرز فئة المنتجات بوضوح احترافي`,
    logo: `شعار بسيط وأنيق لـ ${name} بخلفية بيضاء وتصميم احترافي يسهل التعرف عليه`,
    gallery: `صورة فنية احترافية لـ ${name} بتكوين أنيق وإضاءة طبيعية وجاذبية بصرية عالية`,
  };

  return suggestions[type] || suggestions.product;
}