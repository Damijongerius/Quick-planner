import { getSprints } from "@/lib/actions";
import { SprintPage } from "@/components/SprintPage";

export default async function Sprints() {
  const sprints = await getSprints();

  return (
    <div>
      <SprintPage sprints={sprints} />
    </div>
  );
}
