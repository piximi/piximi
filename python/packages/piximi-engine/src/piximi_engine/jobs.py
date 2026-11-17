"""Long-running work, observable by every client of the session; the
counterpart of the frontend's ``JobRegistry``. Cancellation is a flag the
running work checks, since nothing can interrupt it otherwise."""

from __future__ import annotations

import time
from collections.abc import Callable

from piximi_schema.events import JobsDidUpdate
from piximi_schema.jobs import Job, JobKind, JobStatus
from piximi_schema.unknown import generate_uuid

TERMINAL = {JobStatus.SUCCEEDED, JobStatus.FAILED, JobStatus.CANCELLED}


class JobRegistry:
    def __init__(self, emit: Callable[[JobsDidUpdate], None]) -> None:
        self._jobs: dict[str, Job] = {}
        self._cancelling: set[str] = set()
        self._emit = emit

    def start(self, kind: JobKind, message: str) -> Job:
        job = Job(
            id=generate_uuid(),
            kind=kind,
            status=JobStatus.RUNNING,
            progress=-1,
            message=message,
            started_at=time.time() * 1000,
        )
        self._jobs[job.id] = job
        self._emit(JobsDidUpdate(type="jobs/didUpdate", job=job))
        return job

    def update(self, job_id: str, *, progress: float | None = None, message: str | None = None) -> None:
        job = self._jobs.get(job_id)
        if job is None or job.status in TERMINAL:
            return
        changes = {}
        if progress is not None:
            changes["progress"] = progress
        if message is not None:
            changes["message"] = message
        self._replace(job.model_copy(update=changes))

    def finish(
        self, job_id: str, status: JobStatus, *, message: str | None = None, error: str | None = None
    ) -> None:
        job = self._jobs.get(job_id)
        if job is None or job.status in TERMINAL:
            return
        self._cancelling.discard(job_id)
        self._replace(
            job.model_copy(
                update={
                    "status": status,
                    "progress": 100 if status == JobStatus.SUCCEEDED else job.progress,
                    "message": message if message is not None else job.message,
                    "error": error,
                    "finished_at": time.time() * 1000,
                }
            )
        )

    def cancel(self, job_id: str) -> None:
        job = self._jobs.get(job_id)
        if job is None or job.status in TERMINAL:
            return
        self._cancelling.add(job_id)
        self._replace(job.model_copy(update={"status": JobStatus.STOPPING, "message": "Stopping..."}))

    def is_cancelling(self, job_id: str) -> bool:
        return job_id in self._cancelling

    def list(self) -> list[Job]:
        return list(self._jobs.values())

    def _replace(self, job: Job) -> None:
        self._jobs[job.id] = job
        self._emit(JobsDidUpdate(type="jobs/didUpdate", job=job))
