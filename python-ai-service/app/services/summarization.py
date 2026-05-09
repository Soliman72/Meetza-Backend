import re
from collections import Counter

# common words in Egyptian Arabic + MSA + English to ignore in scoring
ARABIC_STOPWORDS = {
    "في", "من", "إلى", "على", "عن", "مع", "هذا", "هذه", "هو", "هي", "هم",
    "أن", "إن", "كان", "كانت", "يكون", "ما", "لا", "لم", "قد", "إذا", "أو",
    "و", "ف", "ب", "ل", "ك", "ان", "كل", "بعض", "أي", "أنا", "انا", "احنا",
    "انت", "أنت", "ده", "دي", "دول", "اللي", "بتاع", "بتاعة", "فيه", "فيها",
    "عليه", "عليها", "ليه", "ليها", "منه", "منها", "بيه", "بيها", "عنه",
    "عنها", "اللى", "هى", "إحنا", "هما", "إنت", "اى", "أى",
    "the", "a", "an", "is", "are", "was", "were", "to", "of", "and", "in",
    "that", "it", "for", "on", "with", "as", "be", "this", "by", "at",
}


def split_sentences(text: str, lang: str) -> list[str]:
    """
    Split text into a list of sentences based on language-specific delimiters.

    Args:
        text (str): The input text to be split.
        lang (str): The language code ('ar' or 'en').

    Returns:
        list[str]: A list of cleaned sentences longer than 15 characters.
    """
    if lang == "ar":
        sentences = re.split(r"[.؟!،\n]+", text)
    else:
        sentences = re.split(r"[.?!\n]+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 15]


def extractive_summary(text: str, lang: str, ratio: float = 0.3) -> str:
    """
    Generate an extractive summary of the provided text.

    Uses a word-frequency scoring mechanism to identify and extract the most 
    important sentences.

    Args:
        text (str): The full text to summarize.
        lang (str): The language of the text ('ar' or 'en').
        ratio (float): The percentage of sentences to keep (default 0.3).

    Returns:
        str: The generated summary.
    """
    sentences = split_sentences(text, lang)

    if not sentences:
        return text
    if len(sentences) <= 3:
        return text

    all_words = re.findall(r"\w+", text.lower())
    word_freq = Counter(
        w for w in all_words
        if w not in ARABIC_STOPWORDS and len(w) > 2
    )

    scored = []
    for i, sentence in enumerate(sentences):
        words = re.findall(r"\w+", sentence.lower())
        score = sum(word_freq.get(w, 0) for w in words if w not in ARABIC_STOPWORDS)
        normalized = score / (len(words) + 1)
        scored.append((normalized, i, sentence))

    n_to_keep = max(2, int(len(sentences) * ratio))
    top = sorted(scored, key=lambda x: x[0], reverse=True)[:n_to_keep]
    top_sorted = sorted(top, key=lambda x: x[1])

    sep = "، " if lang == "ar" else ". "
    return sep.join(s[2] for s in top_sorted)


def _tokenize(text: str) -> list[str]:
    """
    Tokenize text into lowercased words.
    """
    return re.findall(r"\w+", text.lower())


def extract_topics(text: str, max_topics: int = 8) -> list[str]:
    """
    Extract key topics (unigrams and bigrams) from the text.

    Args:
        text (str): The text to analyze.
        max_topics (int): Maximum number of topics to return.

    Returns:
        list[str]: A list of identified topics/keywords.
    """
    words = [w for w in _tokenize(text) if len(w) > 2 and w not in ARABIC_STOPWORDS]
    if not words:
        return []

    unigram_counts = Counter(words)

    bigrams: list[str] = []
    for a, b in zip(words, words[1:]):
        if a == b:
            continue
        bigrams.append(f"{a} {b}")
    bigram_counts = Counter(bigrams)

    want_bigrams = max(0, min(int(max_topics * 0.4), 4))
    want_unigrams = max_topics - want_bigrams

    candidates: list[str] = []
    candidates.extend([p for p, _ in bigram_counts.most_common(want_bigrams * 3)])
    candidates.extend([w for w, _ in unigram_counts.most_common(want_unigrams * 3)])

    picked: list[str] = []
    for c in candidates:
        if c in picked:
            continue
        if any((c in p and c != p) for p in picked):
            continue
        picked.append(c)
        if len(picked) >= max_topics:
            break
    return picked

