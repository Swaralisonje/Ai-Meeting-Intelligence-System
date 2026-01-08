import re


def extract_dates(transcript: str):
    """
    Extract important dates in DATE/MONTH/YEAR format.
    ALWAYS specifies what should be done on that date.
    Format: "Date – What needs to be done – By whom (if mentioned)"
    """
    if not transcript or not transcript.strip():
        return []

    dates_with_context = []

    # Pattern 1: Extract task deadlines - "[Name] will [task] by [date]"
    # This gives us: Date, Task, and Owner
    task_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will\s+([^.]*?)\s+by\s+((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s*,\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)?)'
    matches = re.finditer(task_pattern, transcript, re.IGNORECASE)
    for match in matches:
        name = match.group(1)
        task = match.group(2).strip()[:70]  # What needs to be done
        day_name = match.group(3).strip()
        month_date = match.group(4).strip() if match.group(4) else ""

        # Build full date
        if month_date:
            full_date = f"{day_name}, {month_date}".strip()
        else:
            # Try to find month/date after the day name
            after_match = transcript[match.end():match.end() + 40]
            month_match = re.search(
                r',\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?)',
                after_match, re.IGNORECASE)
            if month_match:
                full_date = f"{day_name}, {month_match.group(1)}"
            else:
                full_date = day_name

        # Format: "Date – What to do – Who"
        dates_with_context.append(f"{full_date} – {task} – {name}")

    # Pattern 2: Full dates with month - "October 15th" or "Tuesday, October 15th"
    # Extract what needs to be done on this date
    full_date_pattern = r'\b((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s+\d{4})?)'
    matches = re.finditer(full_date_pattern, transcript, re.IGNORECASE)
    for match in matches:
        day = match.group(1).strip() if match.group(1) else ""
        date_part = match.group(2).strip()
        full_date = f"{day} {date_part}".strip()

        # Get context - what needs to be done on this date
        start = max(0, match.start() - 100)
        end = min(len(transcript), match.end() + 100)
        context = transcript[start:end]

        # Extract what needs to be done
        task_desc = None
        owner_name = None

        # Look for "will [task] by [date]" or "[task] by [date]"
        will_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will\s+([^.]*?)\s+by\s+', context, re.IGNORECASE)
        if will_match:
            owner_name = will_match.group(1)
            task_desc = will_match.group(2).strip()[:60]
        else:
            # Look for other patterns: "complete X by", "finish X by", "do X by"
            action_match = re.search(r'\b(complete|finish|do|work on|handle|manage)\s+([^.,;!?]*?)\s+by\s+', context,
                                     re.IGNORECASE)
            if action_match:
                action = action_match.group(1)
                task_part = action_match.group(2).strip()[:60]
                task_desc = f"{action} {task_part}"
                # Try to find owner before the action
                before_action = context[:action_match.start()]
                name_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+', before_action[-50:])
                if name_match:
                    owner_name = name_match.group(1)
            else:
                # Look for events: demo, review, meeting, deadline
                if 'demo' in context.lower():
                    task_desc = "Live demo and stakeholder review"
                elif 'review' in context.lower():
                    task_desc = "Review session"
                elif 'meeting' in context.lower():
                    task_desc = "Meeting scheduled"
                elif 'deadline' in context.lower():
                    task_desc = "Task deadline"
                    # Try to find owner
                    name_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+', context)
                    if name_match:
                        owner_name = name_match.group(1)

        # Always include what needs to be done
        if task_desc and owner_name:
            dates_with_context.append(f"{full_date} – {task_desc} – {owner_name}")
        elif task_desc:
            dates_with_context.append(f"{full_date} – {task_desc}")
        elif full_date not in [d.split(' – ')[0] for d in dates_with_context]:
            # Even if no specific task, mark it as important date
            dates_with_context.append(f"{full_date} – Important date mentioned")

    # Pattern 3: Numeric dates - "10/15/2024" or "15-10-2024"
    numeric_pattern = r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b'
    matches = re.finditer(numeric_pattern, transcript)
    for match in matches:
        month = match.group(1)
        day = match.group(2)
        year = match.group(3)
        if len(year) == 2:
            year = '20' + year

        # Format as "October 15, 2024"
        month_names = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
        try:
            month_name = month_names[int(month)]
            formatted_date = f"{month_name} {day}, {year}"

            # Get context - what needs to be done
            start = max(0, match.start() - 100)
            end = min(len(transcript), match.end() + 100)
            context = transcript[start:end]

            # Extract task and owner
            will_match = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+will\s+([^.]*?)\s+by\s+', context,
                                   re.IGNORECASE)
            if will_match:
                owner_name = will_match.group(1)
                task_desc = will_match.group(2).strip()[:60]
                dates_with_context.append(f"{formatted_date} – {task_desc} – {owner_name}")
            else:
                # Look for other task indicators
                action_match = re.search(r'\b(complete|finish|do|work on|handle)\s+([^.,;!?]*?)\s+(?:by|on|before)\s+',
                                         context, re.IGNORECASE)
                if action_match:
                    task_desc = f"{action_match.group(1)} {action_match.group(2).strip()[:50]}"
                    dates_with_context.append(f"{formatted_date} – {task_desc}")
                elif formatted_date not in [d.split(' – ')[0] for d in dates_with_context]:
                    dates_with_context.append(f"{formatted_date} – Important date mentioned")
        except (ValueError, IndexError):
            pass

    # Pattern 4: Events with dates - "demo on [date]", "review on [date]"
    event_pattern = r'\b(demo|review|meeting|event|appointment|deadline)\s+(?:will\s+)?(?:take place|is|on|scheduled|happening)\s+(?:on\s+)?((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))?'
    matches = re.finditer(event_pattern, transcript, re.IGNORECASE)
    for match in matches:
        event_type = match.group(1)
        day = match.group(2).strip() if match.group(2) else ""
        date_part = match.group(3).strip()
        time_str = match.group(4).strip() if match.group(4) else ""

        full_date = f"{day} {date_part}".strip()
        task_desc = f"{event_type.capitalize()} scheduled"
        if time_str:
            task_desc += f" at {time_str}"

        dates_with_context.append(f"{full_date} – {task_desc}")

    # Remove duplicates
    seen = set()
    unique_dates = []
    for date in dates_with_context:
        date_lower = date.lower()
        if date_lower not in seen:
            seen.add(date_lower)
            unique_dates.append(date)

    # Sort: dates with full context (date + task + owner) first
    dates_with_full_ctx = [d for d in unique_dates if d.count(' – ') == 2]
    dates_with_task = [d for d in unique_dates if d.count(' – ') == 1 and ' – ' in d]
    dates_standalone = [d for d in unique_dates if ' – ' not in d]

    result = dates_with_full_ctx + dates_with_task + dates_standalone

    if not result:
        return ["No specific dates mentioned in the transcript"]

    return result[:15]
