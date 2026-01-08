from agents.summarizer_agent import summarize_meeting
from agents.mom_agent import extract_mom
from agents.task_agent import extract_tasks
from agents.date_agent import extract_dates


def orchestrate_agents(transcript: str):
    try:
        if not transcript or not transcript.strip():
            raise ValueError("Transcript cannot be empty")

        summary = summarize_meeting(transcript)
        mom = extract_mom(transcript)
        tasks = extract_tasks(transcript)
        dates = extract_dates(transcript)

        return {
            "summary": summary,
            "mom": mom,
            "tasks": tasks,
            "important_dates": dates
        }
    except Exception as e:
        raise Exception(f"Orchestration error: {str(e)}")
