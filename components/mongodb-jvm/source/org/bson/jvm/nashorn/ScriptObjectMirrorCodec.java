/**
 * Copyright 2010-2016 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecConfigurationException;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.jvm.internal.BsonUtil;

import jdk.nashorn.api.scripting.ScriptObjectMirror;
import jdk.nashorn.internal.runtime.Context;

/**
 * A BSON codec for Nashorn's native {@link ScriptObjectMirror}.
 * 
 * @author Tal Liron
 */
public class ScriptObjectMirrorCodec implements Codec<ScriptObjectMirror>
{
	//
	// Construction
	//

	/**
	 * Constructor.
	 * 
	 * @param codecRegistry
	 *        The codec registry
	 */
	public ScriptObjectMirrorCodec( CodecRegistry codecRegistry )
	{
		this.codecRegistry = codecRegistry;
	}

	//
	// Codec
	//

	public Class<ScriptObjectMirror> getEncoderClass()
	{
		return ScriptObjectMirror.class;
	}

	@SuppressWarnings("unchecked")
	public void encode( BsonWriter writer, ScriptObjectMirror scriptObjectMirror, EncoderContext encoderContext )
	{
		Object wrapped = ScriptObjectMirror.unwrap( scriptObjectMirror, Context.getGlobal() );
		if( !( wrapped instanceof ScriptObjectMirror ) )
		{
			// Attempt to encode the wrapped object
			Codec<Object> codec = null;
			try
			{
				codec = (Codec<Object>) codecRegistry.get( wrapped.getClass() );
			}
			catch( CodecConfigurationException x )
			{
			}
			if( codec != null )
			{
				codec.encode( writer, wrapped, encoderContext );
				return;
			}
		}

		if( scriptObjectMirror.isArray() )
		{
			writer.writeStartArray();
			for( int i = 0, length = scriptObjectMirror.size(); i < length; i++ )
			{
				Object item = scriptObjectMirror.getSlot( i );
				BsonUtil.writeChild( item, writer, encoderContext, codecRegistry );
			}
			writer.writeEndArray();
		}
		else
		{
			writer.writeStartDocument();
			for( String key : scriptObjectMirror.getOwnKeys( true ) )
			{
				Object value = scriptObjectMirror.get( key );
				writer.writeName( key );
				BsonUtil.writeChild( value, writer, encoderContext, codecRegistry );
			}
			writer.writeEndDocument();
		}
	}

	public ScriptObjectMirror decode( BsonReader reader, DecoderContext decoderContext )
	{
		throw new UnsupportedOperationException( ScriptObjectMirrorCodec.class.getCanonicalName() + ".decode" );
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private final CodecRegistry codecRegistry;
}
