from chains.task_chain import task_chain


def extract_tasks(transcript: str):
    return task_chain(transcript)
