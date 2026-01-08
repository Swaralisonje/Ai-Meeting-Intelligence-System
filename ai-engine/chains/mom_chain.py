import re


def mom_chain(transcript: str):
    """
    Extract Minutes of Meeting (MOM) with COMPLETE sentences.
    Focuses on DECISIONS and FINALIZED items.
    """
    if not transcript or not transcript.strip():
        return []

    # Split into sentences - keep them complete
    sentences = transcript.replace('\n', ' ').split('. ')
    sentences = [s.strip() + '.' for s in sentences if s.strip() and len(s.strip()) > 15]

    if not sentences:
        return ["No meaningful content found in transcript."]

    decision_keywords = ['finalized', 'finalised', 'decided', 'agreed', 'approved', 'confirmed', 'resolved',
                         'completed']
    status_keywords = ['stable', 'in place', 'ready', 'done', 'finished']

    mom_points = []

    for sentence in sentences:
        sentence_lower = sentence.lower()

        # Extract finalized/decided items - KEEP COMPLETE SENTENCE
        if any(keyword in sentence_lower for keyword in decision_keywords):
            # Keep the full sentence, just clean leading filler
            cleaned = re.sub(r'^(the|a|an|and|now|so|well)\s+', '', sentence, flags=re.IGNORECASE)
            cleaned = cleaned.strip()
            if len(cleaned) > 20:
                # Ensure it's a complete sentence
                if not cleaned.endswith('.'):
                    cleaned += '.'
                mom_points.append(cleaned.capitalize())

        # Extract status items - COMPLETE SENTENCES
        elif any(keyword in sentence_lower for keyword in status_keywords):
            # Keep full sentence
            cleaned = re.sub(r'^(the|a|an|and)\s+', '', sentence, flags=re.IGNORECASE)
            cleaned = cleaned.strip()
            if len(cleaned) > 20 and cleaned not in mom_points:
                if not cleaned.endswith('.'):
                    cleaned += '.'
                mom_points.append(cleaned.capitalize())

        # Extract task deadlines as decisions - COMPLETE SENTENCE
        elif 'by' in sentence_lower and 'will' in sentence_lower:
            name_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will', sentence)
            date_match = re.search(r'\bby\s+([^.,;!?]+)', sentence, re.IGNORECASE)
            if name_match and date_match:
                name = name_match.group(1)
                date = date_match.group(1).strip()
                # Keep as complete sentence
                mom_points.append(f"{name} will complete assigned tasks by {date}.")

    # Extract demo/review dates - COMPLETE INFORMATION
    demo_match = re.search(
        r'([^.]*(?:demo|review|meeting)\s+(?:will\s+)?(?:take place|is|on|scheduled)\s+(?:on\s+)?[^.,;!?]+)',
        transcript, re.IGNORECASE)
    if demo_match:
        date_info = demo_match.group(1).strip()
        if len(date_info) > 10:
            if not date_info.endswith('.'):
                date_info += '.'
            mom_points.append(date_info.capitalize())

    # Remove duplicates
    seen = set()
    unique_points = []
    for point in mom_points:
        point_lower = point.lower()
        if point_lower not in seen and len(point) > 15:
            seen.add(point_lower)
            # Keep complete sentences, don't truncate
            unique_points.append(point)

    # If no decisions found, extract complete status sentences
    if not unique_points:
        for sentence in sentences:
            if re.search(r'\b(is|are|has been|was)\s+(stable|complete|ready|done|finished|final)', sentence,
                         re.IGNORECASE):
                cleaned = sentence.strip()
                if len(cleaned) > 20:
                    if not cleaned.endswith('.'):
                        cleaned += '.'
                    unique_points.append(cleaned.capitalize())

    if not unique_points:
        return ["No specific decisions or finalized items identified in the transcript."]

    return unique_points[:8]  # Limit to 8 decision points
