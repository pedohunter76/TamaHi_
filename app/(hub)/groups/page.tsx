import { GroupsExplorer } from "@/components/groups-explorer";

export default function GroupsPage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            Academics
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">
          Institutes & Programs
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Explore Far Eastern University&apos;s degree programs and institutes.
          Find out where your lobby batchmates study.
        </p>
      </section>

      <GroupsExplorer />
    </div>
  );
}

