from chains.summary_chain import summary_chain


def summarize_meeting(transcript: str):
    return summary_chain(transcript)
