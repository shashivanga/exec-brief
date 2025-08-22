-- Fix missing RLS policies for all tables
-- Cards policies
CREATE POLICY "Users can view their own cards" 
ON public.cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" 
ON public.cards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" 
ON public.cards 
FOR DELETE 
USING (auth.uid() = user_id);

-- Dashboards policies
CREATE POLICY "Users can view their own dashboards" 
ON public.dashboards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards" 
ON public.dashboards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards" 
ON public.dashboards 
FOR DELETE 
USING (auth.uid() = user_id);

-- Companies policies
CREATE POLICY "Users can view their own companies" 
ON public.companies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies" 
ON public.companies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies" 
ON public.companies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Topics policies
CREATE POLICY "Users can view their own topics" 
ON public.topics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own topics" 
ON public.topics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics" 
ON public.topics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics" 
ON public.topics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Feeds policies
CREATE POLICY "Users can view their own feeds" 
ON public.feeds 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feeds" 
ON public.feeds 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feeds" 
ON public.feeds 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feeds" 
ON public.feeds 
FOR DELETE 
USING (auth.uid() = user_id);

-- Items policies
CREATE POLICY "Users can view their own items" 
ON public.items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items" 
ON public.items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
ON public.items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
ON public.items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- KPIs policies
CREATE POLICY "Users can view their own kpis" 
ON public.kpis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kpis" 
ON public.kpis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kpis" 
ON public.kpis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kpis" 
ON public.kpis 
FOR DELETE 
USING (auth.uid() = user_id);

-- KPI Points policies
CREATE POLICY "Users can view their own kpi_points" 
ON public.kpi_points 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kpi_points" 
ON public.kpi_points 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kpi_points" 
ON public.kpi_points 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kpi_points" 
ON public.kpi_points 
FOR DELETE 
USING (auth.uid() = user_id);

-- Document texts policies (linked to documents via document_id)
CREATE POLICY "Users can view document texts for their documents" 
ON public.document_texts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_texts.document_id 
    AND documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create document texts for their documents" 
ON public.document_texts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_texts.document_id 
    AND documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update document texts for their documents" 
ON public.document_texts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_texts.document_id 
    AND documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete document texts for their documents" 
ON public.document_texts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_texts.document_id 
    AND documents.user_id = auth.uid()
  )
);