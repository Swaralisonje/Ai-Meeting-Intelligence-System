import re


def task_chain(transcript: str):
    """
    Extract action items/tasks with OWNER and DATE properly extracted.
    Format: "Person will do X by Date"
    """
    if not transcript or not transcript.strip():
        return []

    sentences = transcript.replace('\n', ' ').split('. ')
    sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]

    if not sentences:
        return []

    tasks = []

    # Pattern to match: "[Name] will [action] by [date]"
    name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will\s+'

    # Enhanced date patterns - look for full dates with month/day/year
    date_patterns = [
        # "by Tuesday, October 15th" or "by October 15th"
        r'\bby\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)',
        # "by 10/15/2024" or "by 15-10-2024"
        r'\bby\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        # Just day name "by Tuesday" (will try to find month/date nearby)
        r'\bby\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))',
    ]

    for sentence in sentences:
        sentence_lower = sentence.lower()

        # Look for "will" which indicates future action/task
        if 'will' in sentence_lower:
            name_match = re.search(name_pattern, sentence)

            if name_match:
                owner = name_match.group(1)

                # Extract task description and date
                will_index = sentence_lower.find('will')
                task_start = sentence.find('will', will_index) + 4

                # Find date - try to get full date with month
                date_found = None
                date_match = None

                # First try: "by Tuesday, October 15th" format
                full_date_pattern = r'\bby\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)'
                date_match = re.search(full_date_pattern, sentence[task_start:], re.IGNORECASE)
                if date_match:
                    day = date_match.group(1).strip() if date_match.group(1) else ""
                    month_date = date_match.group(2).strip()
                    date_found = f"{day} {month_date}".strip()
                else:
                    # Try numeric date: "by 10/15/2024"
                    numeric_match = re.search(r'\bby\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', sentence[task_start:],
                                              re.IGNORECASE)
                    if numeric_match:
                        date_found = numeric_match.group(1)
                    else:
                        # Try day name only: "by Tuesday" - look for month/date nearby
                        day_match = re.search(r'\bby\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))',
                                              sentence[task_start:], re.IGNORECASE)
                        if day_match:
                            day_name = day_match.group(1)
                            # Look for month/date after the day name
                            after_day = sentence[task_start + day_match.end():task_start + day_match.end() + 50]
                            month_match = re.search(
                                r',\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?)',
                                after_day, re.IGNORECASE)
                            if month_match:
                                date_found = f"{day_name}, {month_match.group(1)}"
                            else:
                                date_found = day_name

                # Extract task description
                if date_match or day_match or numeric_match:
                    if date_match:
                        task_end = task_start + date_match.start()
                    elif numeric_match:
                        task_end = task_start + numeric_match.start()
                    elif day_match:
                        task_end = task_start + day_match.start()
                    else:
                        task_end = len(sentence)

                    task_desc = sentence[task_start:task_end].strip()
                    task_desc = re.sub(r'\s+(by|on|before|due)\s*$', '', task_desc, flags=re.IGNORECASE)
                else:
                    task_desc = sentence[task_start:].strip()
                    task_desc = re.sub(r'[.,;!?]+$', '', task_desc)

                task_desc = task_desc.strip()
                if len(task_desc) > 10:
                    tasks.append({
                        "task": task_desc,
                        "owner": owner,
                        "date": date_found if date_found else "Not specified"
                    })

        # Also look for other patterns: "[Name] needs to/should/must"
        elif any(kw in sentence_lower for kw in ['need to', 'should', 'must', 'going to']):
            owner = None
            owner_patterns = [
                r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:needs?|should|must|is going to)',
            ]

            for pattern in owner_patterns:
                match = re.search(pattern, sentence)
                if match:
                    owner = match.group(1)
                    break

            # Extract date
            date_found = None
            full_date_pattern = r'\b(?:by|on|before|due)\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)'
            date_match = re.search(full_date_pattern, sentence, re.IGNORECASE)
            if date_match:
                day = date_match.group(1).strip() if date_match.group(1) else ""
                month_date = date_match.group(2).strip()
                date_found = f"{day} {month_date}".strip()
            else:
                numeric_match = re.search(r'\b(?:by|on|before|due)\s+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', sentence,
                                          re.IGNORECASE)
                if numeric_match:
                    date_found = numeric_match.group(1)

            # Extract task description
            task_desc = sentence.strip()
            if owner:
                task_desc = re.sub(rf'\b{re.escape(owner)}\s+(?:will|needs?|should|must|is going to)\s+', '', task_desc,
                                   flags=re.IGNORECASE)
            if date_found:
                task_desc = re.sub(rf'\b(?:by|on|before|due)\s+{re.escape(date_found)}\b', '', task_desc,
                                   flags=re.IGNORECASE)

            task_desc = re.sub(r'[.,;!?]+$', '', task_desc).strip()

            if len(task_desc) > 15 and owner:
                tasks.append({
                    "task": task_desc[:200],
                    "owner": owner,
                    "date": date_found if date_found else "Not specified"
                })

    # Remove duplicates
    seen = set()
    unique_tasks = []
    for task in tasks:
        key = (task["task"].lower()[:50], task["owner"].lower())
        if key not in seen:
            seen.add(key)
            unique_tasks.append(task)

    return unique_tasks[:10]
