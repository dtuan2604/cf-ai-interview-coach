type DurableObjectStateLike = object

export class InterviewSessionDurableObject {
  readonly state: DurableObjectStateLike

  constructor(state: DurableObjectStateLike) {
    this.state = state
  }
}
