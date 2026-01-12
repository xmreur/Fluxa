


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."issue_status" AS ENUM (
    'todo',
    'in-progress',
    'done',
    'cancelled'
);


ALTER TYPE "public"."issue_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_issue_vote_count"("p_issue_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  select count(*)
  from votes
  where issue_id = p_issue_id;
$$;


ALTER FUNCTION "public"."get_issue_vote_count"("p_issue_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_teams_for_authenticated_user"() RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT team_id
  FROM public.team_members
  WHERE user_id = auth.uid()
$$;


ALTER FUNCTION "public"."get_teams_for_authenticated_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_admin"("p_project_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.team_members tm
      ON tm.team_id = p.team_id
    WHERE p.id = p_project_id
      AND tm.user_id = auth.uid()::uuid
      AND tm.role IN ('owner', 'admin')
  );
$$;


ALTER FUNCTION "public"."is_project_admin"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_member"("p_project_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
  );$$;


ALTER FUNCTION "public"."is_project_member"("p_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_admin_or_owner"("p_team_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_members.team_id = p_team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('owner','admin')
  );$$;


ALTER FUNCTION "public"."is_team_admin_or_owner"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_member"("p_team_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_team_member"("p_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_owner"("_team_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams
    WHERE id = _team_id
      AND created_by = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_team_owner"("_team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profiles_email"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.email_confirmed_at is not null then
    update profiles
    set email = new.email
    where id = new.id;
  end if;
  
  return new;
end;
$$;


ALTER FUNCTION "public"."update_profiles_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_team_ids"() RETURNS SETOF "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT team_id
  FROM public.team_members
  WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."user_team_ids"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid",
    "invitee_email" character varying,
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "project_id" "uuid"
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_id" "uuid",
    "author_id" "uuid",
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edited_at" timestamp with time zone
);


ALTER TABLE "public"."issue_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_labels" (
    "issue_id" "uuid" NOT NULL,
    "label_id" "uuid" NOT NULL
);


ALTER TABLE "public"."issue_labels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "title" "text",
    "description" "text" NOT NULL,
    "type" "text" DEFAULT 'bug'::"text",
    "priority" integer DEFAULT 3,
    "created_by" "uuid",
    "assigned_to" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "status" "public"."issue_status" DEFAULT 'todo'::"public"."issue_status" NOT NULL,
    CONSTRAINT "issues_type_check" CHECK (("type" = ANY (ARRAY['bug'::"text", 'feature'::"text", 'improvement'::"text", 'task'::"text"])))
);


ALTER TABLE "public"."issues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."labels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "name" "text",
    "color" "text" NOT NULL
);


ALTER TABLE "public"."labels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "team_id" "uuid",
    "issue_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text",
    "body" "text",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "email" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_members" (
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."project_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "team_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votes" (
    "issue_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."issue_comments"
    ADD CONSTRAINT "issue_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issue_labels"
    ADD CONSTRAINT "issue_labels_pkey" PRIMARY KEY ("issue_id", "label_id");



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labels"
    ADD CONSTRAINT "labels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("issue_id", "user_id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_comments"
    ADD CONSTRAINT "issue_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."issue_comments"
    ADD CONSTRAINT "issue_comments_author_id_fkey1" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."issue_comments"
    ADD CONSTRAINT "issue_comments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_labels"
    ADD CONSTRAINT "issue_labels_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_labels"
    ADD CONSTRAINT "issue_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_assigned_to_fkey1" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."issues"
    ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labels"
    ADD CONSTRAINT "labels_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "porject_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_members"
    ADD CONSTRAINT "porject_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin or higher can edit teams" ON "public"."teams" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "tm"."team_id"
   FROM "public"."team_members" "tm"
  WHERE (("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" <> 'member'::"text")))));



CREATE POLICY "Admins and owners can manage all" ON "public"."issue_comments" USING ((("author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."issues" "i"
     JOIN "public"."project_members" "pm" ON (("pm"."project_id" = "i"."project_id")))
  WHERE (("i"."id" = "issue_comments"."issue_id") AND ("pm"."user_id" = "auth"."uid"()) AND ("pm"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "Allow admin to update" ON "public"."projects" FOR UPDATE TO "authenticated" USING ("public"."is_project_admin"("id")) WITH CHECK ("public"."is_project_admin"("id"));



CREATE POLICY "Allow admins to create new labels" ON "public"."labels" FOR INSERT WITH CHECK ("public"."is_project_admin"("project_id"));



CREATE POLICY "Allow admins to delete labels" ON "public"."labels" FOR DELETE TO "authenticated" USING ("public"."is_project_admin"("project_id"));



CREATE POLICY "Allow admins to update" ON "public"."issues" FOR UPDATE USING ("public"."is_project_admin"("project_id")) WITH CHECK ("public"."is_project_admin"("project_id"));



CREATE POLICY "Allow admins to update labels" ON "public"."labels" FOR UPDATE TO "authenticated" USING ("public"."is_project_admin"("project_id")) WITH CHECK ("public"."is_project_admin"("project_id"));



CREATE POLICY "Allow issue creator to view them" ON "public"."issues" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow issues assigned to user" ON "public"."issues" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "assigned_to"));



CREATE POLICY "Allow logged-in user to select their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Allow project members to read data" ON "public"."labels" FOR SELECT TO "authenticated" USING ("public"."is_project_member"("project_id"));



CREATE POLICY "Allow project members to see it" ON "public"."projects" FOR SELECT TO "authenticated" USING (("public"."is_team_admin_or_owner"("team_id") OR "public"."is_project_member"("id")));



CREATE POLICY "Allow project members to view issues" ON "public"."issues" FOR SELECT TO "authenticated" USING ("public"."is_project_member"("project_id"));



CREATE POLICY "Allow read if in project" ON "public"."issue_labels" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "issue_labels"."issue_id") AND ("i"."project_id" IN ( SELECT "project_members"."project_id"
           FROM "public"."project_members"
          WHERE ("project_members"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Allow team members to see issue labels" ON "public"."issue_labels" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ((("public"."labels" "l"
     JOIN "public"."projects" "p" ON (("l"."project_id" = "p"."id")))
     JOIN "public"."team_members" "tm" ON (("p"."team_id" = "tm"."team_id")))
     JOIN "public"."issues" "i" ON (("i"."id" = "issue_labels"."issue_id")))
  WHERE (("i"."project_id" = "p"."id") AND ("tm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow to add if issue owner / assignee" ON "public"."issue_labels" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "issue_labels"."issue_id") AND (("i"."created_by" = "auth"."uid"()) OR ("i"."assigned_to" = "auth"."uid"()))))));



CREATE POLICY "Allow update for own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Allow update if issue owner / assignee" ON "public"."issue_labels" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "issue_labels"."issue_id") AND (("i"."created_by" = "auth"."uid"()) OR ("i"."assigned_to" = "auth"."uid"())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "issue_labels"."issue_id") AND (("i"."created_by" = "auth"."uid"()) OR ("i"."assigned_to" = "auth"."uid"()))))));



CREATE POLICY "Allow users to CRUD their own notifications" ON "public"."notifications" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated Admin/Owner can invite" ON "public"."invites" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."team_members" "tm" ON (("tm"."team_id" = "p"."team_id")))
  WHERE (("p"."id" = "invites"."project_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Enable delete for users based on their email" ON "public"."invites" FOR DELETE USING ((( SELECT "auth"."email"() AS "email") = ("invitee_email")::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."votes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."teams" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable select for authenticated users only" ON "public"."invites" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "GFRLS" ON "public"."projects" FOR SELECT TO "authenticated" USING ("public"."is_team_member"("team_id"));



CREATE POLICY "Join project" ON "public"."project_members" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."projects" "p"
     JOIN "public"."team_members" "tm" ON (("p"."team_id" = "tm"."team_id")))
  WHERE (("p"."id" = "project_members"."project_id") AND ("tm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Only owner can delete team" ON "public"."teams" FOR DELETE TO "authenticated" USING (("id" IN ( SELECT "tm"."team_id"
   FROM "public"."team_members" "tm"
  WHERE (("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'owner'::"text")))));



CREATE POLICY "Owner/Admin or invited user delete invite" ON "public"."invites" FOR DELETE USING (((EXISTS ( SELECT 1
   FROM "public"."team_members" "tm"
  WHERE (("tm"."team_id" = "invites"."team_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))) OR (("invitee_email")::"text" = "auth"."email"())));



CREATE POLICY "Owners manage team members" ON "public"."team_members" USING ("public"."is_team_owner"("team_id")) WITH CHECK ("public"."is_team_owner"("team_id"));



CREATE POLICY "Project admins can insert members" ON "public"."project_members" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_project_admin"("project_id"));



CREATE POLICY "Project admins can update members" ON "public"."project_members" FOR UPDATE TO "authenticated" USING ("public"."is_project_admin"("project_id")) WITH CHECK ("public"."is_project_admin"("project_id"));



CREATE POLICY "Project members create issues" ON "public"."issues" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_project_member"("project_id"));



CREATE POLICY "Remove only if issue owner / assignee" ON "public"."issue_labels" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."issues" "i"
  WHERE (("i"."id" = "issue_labels"."issue_id") AND (("i"."created_by" = "auth"."uid"()) OR ("i"."assigned_to" = "auth"."uid"()))))));



CREATE POLICY "Team admin/owner can add project" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_team_admin_or_owner"("team_id"));



CREATE POLICY "Team members can read project members" ON "public"."project_members" FOR SELECT TO "authenticated" USING ("public"."is_project_member"("project_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."issue_comments" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own votes" ON "public"."votes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own comments" ON "public"."issue_comments" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own votes" ON "public"."votes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can join teams" ON "public"."team_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can leave own teams" ON "public"."team_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read comments on issues they can access" ON "public"."issue_comments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."issues"
  WHERE ("issues"."id" = "issue_comments"."issue_id"))));



CREATE POLICY "Users can update their own comments" ON "public"."issue_comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can view own team memberships" ON "public"."team_members" FOR SELECT USING ("public"."is_team_member"("team_id"));



CREATE POLICY "dawdwad" ON "public"."labels" FOR SELECT USING (true);



ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issue_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issue_labels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."issues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."labels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_issue_vote_count"("p_issue_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_issue_vote_count"("p_issue_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_issue_vote_count"("p_issue_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_teams_for_authenticated_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_teams_for_authenticated_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_teams_for_authenticated_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_admin"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_admin"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_admin"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_member"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_member"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_member"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_admin_or_owner"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_member"("p_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_team_member"("p_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_member"("p_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_owner"("_team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_team_owner"("_team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_owner"("_team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profiles_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profiles_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profiles_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_team_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_team_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_team_ids"() TO "service_role";



GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT ALL ON TABLE "public"."issue_comments" TO "anon";
GRANT ALL ON TABLE "public"."issue_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_comments" TO "service_role";



GRANT ALL ON TABLE "public"."issue_labels" TO "anon";
GRANT ALL ON TABLE "public"."issue_labels" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_labels" TO "service_role";



GRANT ALL ON TABLE "public"."issues" TO "anon";
GRANT ALL ON TABLE "public"."issues" TO "authenticated";
GRANT ALL ON TABLE "public"."issues" TO "service_role";



GRANT ALL ON TABLE "public"."labels" TO "anon";
GRANT ALL ON TABLE "public"."labels" TO "authenticated";
GRANT ALL ON TABLE "public"."labels" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_members" TO "anon";
GRANT ALL ON TABLE "public"."project_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_members" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







