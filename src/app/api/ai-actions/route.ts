import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { action, userId, params } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const userIdTyped = userId as Id<"users">;

    switch (action) {
      // ===== HABITS =====
      case "get_habits": {
        const summary = await convex.query(api.habits.getSummaryForAI, { userId: userIdTyped });
        return NextResponse.json({ success: true, data: summary });
      }

      case "create_habit": {
        const { name, description, icon, category, trackingType, targetValue, targetUnit, frequency } = params;
        const habitId = await convex.mutation(api.habits.createHabit, {
          userId: userIdTyped,
          name,
          description,
          icon: icon || "✨",
          category: category || "custom",
          trackingType: trackingType || "boolean",
          targetValue,
          targetUnit,
          frequency: frequency || "daily",
        });
        return NextResponse.json({ success: true, habitId });
      }

      case "log_habit": {
        const { habitId, completed, value, notes, date } = params;
        await convex.mutation(api.habits.logHabit, {
          userId: userIdTyped,
          habitId: habitId as Id<"habits">,
          completed: completed ?? true,
          value,
          notes,
          date,
        });
        return NextResponse.json({ success: true });
      }

      case "delete_habit": {
        const { habitId } = params;
        await convex.mutation(api.habits.deleteHabit, {
          habitId: habitId as Id<"habits">,
        });
        return NextResponse.json({ success: true });
      }

      // ===== TODOS =====
      case "get_todos": {
        const summary = await convex.query(api.todos.getSummaryForAI, { userId: userIdTyped });
        return NextResponse.json({ success: true, data: summary });
      }

      case "create_todo": {
        const { title, description, priority, dueDate, dueTime, nousReminder } = params;
        const todoId = await convex.mutation(api.todos.createTodo, {
          userId: userIdTyped,
          title,
          description,
          priority,
          dueDate,
          dueTime,
          nousReminder,
        });
        return NextResponse.json({ success: true, todoId });
      }

      case "complete_todo": {
        const { todoId } = params;
        await convex.mutation(api.todos.completeTodo, {
          todoId: todoId as Id<"todos">,
        });
        return NextResponse.json({ success: true });
      }

      case "uncomplete_todo": {
        const { todoId } = params;
        await convex.mutation(api.todos.uncompleteTodo, {
          todoId: todoId as Id<"todos">,
        });
        return NextResponse.json({ success: true });
      }

      case "update_todo": {
        const { todoId, ...updates } = params;
        await convex.mutation(api.todos.updateTodo, {
          todoId: todoId as Id<"todos">,
          ...updates,
        });
        return NextResponse.json({ success: true });
      }

      case "delete_todo": {
        const { todoId } = params;
        await convex.mutation(api.todos.deleteTodo, {
          todoId: todoId as Id<"todos">,
        });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("AI action error:", error);
    return NextResponse.json(
      { error: error.message || "Action failed" },
      { status: 500 }
    );
  }
}
