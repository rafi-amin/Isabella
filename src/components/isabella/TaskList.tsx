
"use client";

import type { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ListChecks, Trash2, Info } from "lucide-react";

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskList: FC<TaskListProps> = ({ tasks, onToggleTask, onDeleteTask }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-lg bg-muted/30">
        <Info className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium font-libre-baskerville">No reminders yet</p>
        <p className="text-sm text-muted-foreground font-libre-baskerville">Isabella can help you set them up!</p>
      </div>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ListChecks className="h-6 w-6 text-primary" />
          Isabella's Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li 
              key={task.id} 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              aria-label={`Task: ${task.text}, Status: ${task.completed ? 'completed' : 'pending'}`}
            >
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => onToggleTask(task.id)}
                aria-labelledby={`task-label-${task.id}`}
              />
              <label
                id={`task-label-${task.id}`}
                htmlFor={`task-${task.id}`}
                className={`flex-1 text-sm cursor-pointer ${
                  task.completed ? "line-through text-muted-foreground" : ""
                }`}
              >
                {task.text}
              </label>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity"
                onClick={() => onDeleteTask(task.id)}
                aria-label={`Delete task "${task.text}"`}
              >
                <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
