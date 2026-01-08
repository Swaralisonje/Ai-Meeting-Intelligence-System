import re


def summary_chain(transcript: str):
    """
    Generate a PARAGRAPH FORMAT summary that identifies the EXACT TOPIC/THEME of the meeting.
    Works for ANY type of meeting (corporate, personal, academic, social, etc.)
    """
    if not transcript or not transcript.strip():
        return "No transcript provided."

    # Clean and process the transcript
    full_text = transcript.replace('\n', ' ').strip()
    sentences = full_text.split('. ')
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]

    if not sentences:
        return "Transcript is too short or contains no meaningful content."

    # Filter out filler/transitional speech
    filler_patterns = [
        r'^(good morning|good afternoon|good evening|hello|hi|hey)',
        r'^(let\'?s|let us)\s+(quickly|now|just|begin|start)',
        r'^(now coming to|moving on to|next|alright|okay|ok)',
        r'^(that\'?s all|thank you|thanks)',
    ]

    def is_filler(sentence):
        sentence_lower = sentence.lower().strip()
        for pattern in filler_patterns:
            if re.match(pattern, sentence_lower, re.IGNORECASE):
                return True
        return False

    meaningful_sentences = [s for s in sentences if not is_filler(s) and len(s) > 20]
    if not meaningful_sentences:
        meaningful_sentences = sentences

    # ANALYZE THE FULL MEETING TO IDENTIFY TOPIC
    # Works for ANY type of meeting - not just corporate

    text_lower = full_text.lower()

    # Comprehensive topic detection for any meeting type
    topic_keywords = {
        # Business/Corporate
        'business': ['business', 'company', 'corporate', 'organization', 'enterprise'],
        'project': ['project', 'milestone', 'deliverable', 'deadline', 'timeline'],
        'product': ['product', 'feature', 'release', 'launch', 'roadmap'],
        'development': ['development', 'coding', 'implementation', 'backend', 'frontend', 'api', 'ui', 'software'],
        'meeting': ['meeting', 'discussion', 'conference', 'call'],
        'planning': ['planning', 'plan', 'strategy', 'roadmap', 'schedule'],
        'review': ['review', 'demo', 'presentation', 'stakeholder', 'evaluation'],
        'status': ['status', 'update', 'progress', 'report'],

        # Personal/Social
        'family': ['family', 'parent', 'child', 'sibling', 'relative'],
        'social': ['party', 'event', 'gathering', 'celebration', 'wedding', 'birthday'],
        'personal': ['personal', 'life', 'home', 'house', 'apartment'],
        'health': ['health', 'doctor', 'medical', 'hospital', 'treatment', 'therapy'],
        'education': ['school', 'university', 'college', 'student', 'teacher', 'class', 'exam', 'assignment'],
        'travel': ['travel', 'trip', 'vacation', 'flight', 'hotel', 'destination'],
        'finance': ['money', 'budget', 'payment', 'loan', 'investment', 'bank'],

        # Academic
        'academic': ['research', 'thesis', 'paper', 'publication', 'study', 'experiment'],
        'course': ['course', 'curriculum', 'syllabus', 'lecture', 'seminar'],

        # Other
        'legal': ['legal', 'law', 'contract', 'agreement', 'lawsuit', 'court'],
        'medical': ['medical', 'diagnosis', 'surgery', 'medication', 'appointment'],
    }

    # Count keyword mentions to identify topic
    topic_scores = {}
    for topic, keywords in topic_keywords.items():
        score = sum(text_lower.count(kw) for kw in keywords)
        if score > 0:
            topic_scores[topic] = score

    # Identify primary topic
    primary_topic = None
    if topic_scores:
        sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
        primary_topic = sorted_topics[0][0]

    # Extract key entities (names, places, specific subjects)
    entities = []
    # Capitalized phrases (could be names, places, projects)
    entity_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)'
    entity_matches = re.findall(entity_pattern, full_text)
    for entity in entity_matches[:5]:
        if entity.lower() not in ['good morning', 'thank you', 'let us', 'tuesday', 'wednesday', 'thursday', 'friday',
                                  'saturday', 'sunday', 'monday']:
            entities.append(entity)

    # Build meeting topic based on analysis
    if primary_topic:
        topic_map = {
            'business': 'business',
            'project': 'project',
            'product': 'product development',
            'development': 'software development',
            'meeting': 'team',
            'planning': 'planning',
            'review': 'review',
            'status': 'status update',
            'family': 'family',
            'social': 'social',
            'personal': 'personal',
            'health': 'health',
            'education': 'educational',
            'travel': 'travel',
            'finance': 'financial',
            'academic': 'academic',
            'course': 'course',
            'legal': 'legal',
            'medical': 'medical',
        }
        meeting_topic = topic_map.get(primary_topic, primary_topic)
    else:
        # Fallback: analyze from sentence structure and content
        if len(meaningful_sentences) > 0:
            first_sent = meaningful_sentences[0].lower()
            if any(kw in first_sent for kw in ['discuss', 'talk about', 'meeting about']):
                # Extract what they're discussing
                discuss_match = re.search(r'(?:discuss|talk about|meeting about)\s+([^.,;!?]+)', first_sent)
                if discuss_match:
                    meeting_topic = discuss_match.group(1).strip()[:50]
                else:
                    meeting_topic = "general discussion"
            else:
                meeting_topic = "meeting"
        else:
            meeting_topic = "meeting"

    # Add context if entities found
    if entities and len(entities) > 0:
        meeting_topic = f"{meeting_topic} regarding {', '.join(entities[:2])}"

    # Generate a SINGLE CONCISE PARAGRAPH that captures the entire meeting
    # Users can read this instead of listening to the full meeting

    # Extract key information: what happened, decisions, actions, outcomes
    key_elements = {
        'decisions': [],
        'actions': [],
        'status': [],
        'assignments': [],
        'outcomes': []
    }

    # Extract decisions and finalized items
    decision_keywords = ['finalized', 'decided', 'agreed', 'approved', 'confirmed', 'resolved']
    for sent in meaningful_sentences:
        sent_lower = sent.lower()
        if any(kw in sent_lower for kw in decision_keywords) and not is_filler(sent):
            cleaned = re.sub(r'^(now|so|well|alright|okay)\s+', '', sent.strip(), flags=re.IGNORECASE)
            if len(cleaned) > 20:
                key_elements['decisions'].append(cleaned)
                if len(key_elements['decisions']) >= 3:
                    break

    # Extract actions and tasks
    action_keywords = ['will', 'going to', 'plan to', 'need to', 'should', 'must']
    for sent in meaningful_sentences:
        sent_lower = sent.lower()
        if any(kw in sent_lower for kw in action_keywords) and not is_filler(sent):
            cleaned = re.sub(r'^(now|so|well|alright|okay)\s+', '', sent.strip(), flags=re.IGNORECASE)
            if len(cleaned) > 25 and cleaned not in key_elements['actions']:
                key_elements['actions'].append(cleaned)
                if len(key_elements['actions']) >= 4:
                    break

    # Extract status updates
    status_keywords = ['stable', 'completed', 'ready', 'in place', 'done', 'finished']
    for sent in meaningful_sentences:
        sent_lower = sent.lower()
        if any(kw in sent_lower for kw in status_keywords) and not is_filler(sent):
            cleaned = re.sub(r'^(now|so|well|alright|okay)\s+', '', sent.strip(), flags=re.IGNORECASE)
            if len(cleaned) > 20 and cleaned not in key_elements['status']:
                key_elements['status'].append(cleaned)
                if len(key_elements['status']) >= 2:
                    break

    # Extract task assignments (Name will do X by Y)
    assignment_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will\s+([^.]*?)\s+by\s+[^.]*'
    for sent in meaningful_sentences:
        match = re.search(assignment_pattern, sent, re.IGNORECASE)
        if match and not is_filler(sent):
            name = match.group(1)
            task = match.group(2).strip()[:60]
            assignment = f"{name} will {task}"
            if assignment not in key_elements['assignments']:
                key_elements['assignments'].append(assignment)
                if len(key_elements['assignments']) >= 3:
                    break

    # Extract outcomes/conclusions
    conclusion_sentences = [s for s in meaningful_sentences[-3:] if not is_filler(s)]
    if conclusion_sentences:
        for sent in conclusion_sentences:
            cleaned = re.sub(r'^(that\'?s all|thank you|thanks)[^.]*\.?\s*', '', sent.strip(), flags=re.IGNORECASE)
            if len(cleaned) > 20:
                key_elements['outcomes'].append(cleaned)

    # BUILD MEETING TOPIC SENTENCE
    # Format: "The meeting focused on [topic], [topic], and [topic]."
    topic_parts = []

    # Identify main themes from the meeting
    if 'planning' in text_lower or 'plan' in text_lower:
        topic_parts.append('planning')
    if key_elements['assignments'] or 'assign' in text_lower or 'task' in text_lower:
        topic_parts.append('task assignments')
    if any('deadline' in s.lower() or 'by' in s.lower() for s in meaningful_sentences):
        topic_parts.append('important deadlines')
    if key_elements['decisions']:
        topic_parts.append('key decisions')
    if 'status' in text_lower or 'update' in text_lower:
        topic_parts.append('status updates')
    if 'review' in text_lower or 'demo' in text_lower:
        topic_parts.append('review and evaluation')

    # If no specific themes found, use the primary topic
    if not topic_parts:
        if primary_topic:
            topic_parts.append(meeting_topic)
        else:
            topic_parts.append('discussion')

    # Build topic sentence
    if len(topic_parts) == 1:
        topic_sentence = f"The meeting focused on {topic_parts[0]}."
    elif len(topic_parts) == 2:
        topic_sentence = f"The meeting focused on {topic_parts[0]} and {topic_parts[1]}."
    else:
        # Join with commas and "and" before last item
        topic_sentence = f"The meeting focused on {', '.join(topic_parts[:-1])}, and {topic_parts[-1]}."

    # BUILD SUMMARY PARAGRAPH (without repeating the topic)
    # Just describe what happened, don't say "the meeting focused on..."
    paragraph_sentences = []

    # Extract key information sentences (what actually happened)
    # Start with context/background if available
    context_keywords = ['purpose', 'due to', 'because', 'reason', 'need to']
    for sent in meaningful_sentences[:3]:
        sent_lower = sent.lower()
        if any(kw in sent_lower for kw in context_keywords) and not is_filler(sent):
            cleaned = re.sub(r'^(now|so|well|alright|okay|the purpose of this meeting is to)\s+', '', sent.strip(),
                             flags=re.IGNORECASE)
            cleaned = re.sub(r'^(discuss|talk about)\s+', '', cleaned, flags=re.IGNORECASE)
            if len(cleaned) > 25:
                paragraph_sentences.append(cleaned)
                break

    # Add status updates (what's current state)
    if key_elements['status']:
        status_text = ' '.join(key_elements['status'][:2])
        paragraph_sentences.append(status_text)

    # Add decisions made (with dates if available)
    if key_elements['decisions']:
        decisions_text = ' '.join(key_elements['decisions'][:2])
        paragraph_sentences.append(decisions_text)

    # Add important dates/deadlines mentioned
    date_sentences = []
    for sent in meaningful_sentences:
        # Look for sentences with dates - fixed regex pattern
        date_pattern = r'\b(?:by|on|before|due)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
        if re.search(date_pattern, sent, re.IGNORECASE):
            cleaned = re.sub(r'^(now|so|well|alright|okay|now coming to)\s+', '', sent.strip(), flags=re.IGNORECASE)
            if len(cleaned) > 20 and cleaned not in date_sentences:
                date_sentences.append(cleaned)
                if len(date_sentences) >= 3:
                    break

    if date_sentences:
        paragraph_sentences.extend(date_sentences[:3])

    # Add task assignments
    if key_elements['assignments']:
        assignments_text = ' '.join(key_elements['assignments'][:3])
        paragraph_sentences.append(assignments_text)

    # Add other important actions (if not already covered)
    if key_elements['actions'] and len(key_elements['assignments']) < 2:
        remaining_actions = key_elements['actions'][:2]
        actions_text = ' '.join(remaining_actions)
        paragraph_sentences.append(actions_text)

    # Add outcomes/conclusions
    if key_elements['outcomes']:
        outcomes_text = ' '.join(key_elements['outcomes'][:1])
        paragraph_sentences.append(outcomes_text)

    # Combine into single flowing paragraph
    summary_paragraph = ' '.join(paragraph_sentences)

    # If no sentences were collected, create a basic summary from meaningful sentences
    if not summary_paragraph or len(summary_paragraph.strip()) < 20:
        # Fallback: use first few meaningful sentences
        fallback_sentences = meaningful_sentences[:5]
        summary_paragraph = ' '.join(fallback_sentences)

    # Clean up: remove extra spaces, fix punctuation
    summary_paragraph = re.sub(r'\s+', ' ', summary_paragraph)
    summary_paragraph = re.sub(r'\.\s+\.', '.', summary_paragraph)
    summary_paragraph = re.sub(r'\s+([.,;!?])', r'\1', summary_paragraph)

    # Ensure it ends with a period
    if not summary_paragraph.endswith('.'):
        summary_paragraph += '.'

    # Limit length to keep it concise (aim for 200-400 words)
    words = summary_paragraph.split()
    if len(words) > 400:
        # Keep first 400 words
        summary_paragraph = ' '.join(words[:400])
        if not summary_paragraph.endswith('.'):
            summary_paragraph += '...'

    # Ensure topic_sentence is defined (should always be, but safety check)
    if 'topic_sentence' not in locals():
        topic_sentence = f"The meeting focused on {meeting_topic}."

    # Return: Meeting Topic Sentence + Summary Paragraph (without topic repetition)
    return f"Meeting Topic: {topic_sentence}\n\nSummary: {summary_paragraph}"
