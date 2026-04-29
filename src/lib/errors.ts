// FunctionsHttpError de supabase-js no expone el body de la respuesta en .message
// (devuelve "non-2xx response"), pero sí expone el Response original en .context.
// Este helper extrae el mensaje real que devolvió la edge function en su body JSON.
export async function extractEdgeFunctionError(
  data: { error?: string; success?: boolean } | null,
  fnError: Error | null,
  fallback: string,
): Promise<string> {
  let mensaje = data?.error ?? fnError?.message ?? fallback
  const response = (fnError as { context?: Response } | null)?.context
  if (response && typeof response.json === 'function') {
    try {
      const body = await response.json()
      if (body?.error) mensaje = body.error
    } catch {
      // El body no era JSON; nos quedamos con el mensaje genérico.
    }
  }
  return mensaje
}
