-- Create optional document_texts table for extracted text storage
CREATE TABLE public.document_texts (
    document_id UUID NOT NULL PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
    page_count INTEGER,
    text TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on document_texts
ALTER TABLE public.document_texts ENABLE ROW LEVEL SECURITY;

-- RLS policy for document_texts
CREATE POLICY "Users can view org document texts" ON public.document_texts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_texts.document_id 
            AND public.is_org_member(d.org_id)
        )
    );

CREATE POLICY "Users can insert org document texts" ON public.document_texts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_texts.document_id 
            AND public.is_org_member(d.org_id)
        )
    );