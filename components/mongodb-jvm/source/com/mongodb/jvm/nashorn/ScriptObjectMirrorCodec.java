/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.jvm.nashorn;

import org.bson.BsonReader;
import org.bson.BsonWriter;
import org.bson.codecs.Codec;
import org.bson.codecs.DecoderContext;
import org.bson.codecs.EncoderContext;
import org.bson.codecs.configuration.CodecConfigurationException;
import org.bson.codecs.configuration.CodecRegistry;

import jdk.nashorn.api.scripting.ScriptObjectMirror;
import jdk.nashorn.internal.runtime.Context;

/**
 * A BSON codec for a Nashorn {@link ScriptObjectMirror}.
 * 
 * @author Tal Liron
 */
public class ScriptObjectMirrorCodec implements Codec<ScriptObjectMirror>
{
	//
	// Construction
	//

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

	public void encode( BsonWriter writer, ScriptObjectMirror scriptObjectMirror, EncoderContext encoderContext )
	{
		Object wrapped = ScriptObjectMirror.unwrap( scriptObjectMirror, Context.getGlobal() );
		if( !( wrapped instanceof ScriptObjectMirror ) )
		{
			// Attempt to encode the wrapped object
			try
			{
				@SuppressWarnings("unchecked")
				Codec<Object> codec = (Codec<Object>) codecRegistry.get( wrapped.getClass() );
				codec.encode( writer, wrapped, encoderContext );
				return;
			}
			catch( CodecConfigurationException x )
			{
			}
		}

		if( scriptObjectMirror.isArray() )
		{
			writer.writeStartArray();
			int length = scriptObjectMirror.size();
			for( int i = 0; i < length; i++ )
			{
				Object item = scriptObjectMirror.getSlot( i );
				BsonUtil.encodeChild( item, writer, encoderContext, codecRegistry );
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
				BsonUtil.encodeChild( value, writer, encoderContext, codecRegistry );
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
